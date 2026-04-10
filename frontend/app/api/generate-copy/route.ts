import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const isAdMode = !!body.user_input;

    // ── AI 이미지 생성 모드 (user_input + category_key + history) ──
    if (isAdMode) {
      const { user_input, category_key, history = [] } = body;

      const historyMessages = history.flatMap((h: { user_input: string; copy: string }) => [
        { role: 'user', content: h.user_input },
        { role: 'assistant', content: h.copy }
      ]);

      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({
          copies: [
            `✨ ${user_input} — 브랜드의 감성을 담은 광고 문구입니다. #광고 #마케팅`,
            `🚀 지금 바로 경험하세요. ${user_input}을 통해 새로운 가능성을 열어보세요.`,
            `💡 ${user_input} — 고객의 마음을 사로잡는 한 줄의 힘.`
          ]
        });
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `당신은 10년 차 베테랑 광고 카피라이터입니다. 업종(${category_key || 'general'})에 맞는 감각적이고 강렬한 광고 문구 3개를 작성하세요. 이전 대화를 참고하여 점진적으로 개선된 문구를 제안하세요. 반드시 {"copies": ["문구1", "문구2", "문구3"]} 형태의 JSON으로만 응답하세요.`
            },
            ...historyMessages,
            { role: 'user', content: user_input }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) throw new Error(`OpenAI API Error: ${response.status}`);
      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);
      return NextResponse.json({ copies: content.copies });
    }

    // ── 배경 합성 모드 (menuName + ingredients) ──
    const { menuName, ingredients } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        copies: [
          `[인스타그램] "한 입 베어 무는 순간, 입안 가득 퍼지는 ${menuName || '완벽한 풍미'}." 오늘 하루의 피로를 싹 씻어줄 궁극의 조화를 만나보세요. 🍷✨`,
          `[배달앱 리뷰1위🥇] 사장님이 매일 아침 직접 고른 ${ingredients || '재료'}! 한정수량 마감 전 서두르세요! 🛵💨`,
          `[당근마켓 이웃환영🥕] 동네 단골 이웃님들! 이번에 정말 특별한 ${menuName || '특선 메뉴'}를 준비했어요. 편하게 맛보러 들러주세요~`
        ]
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 10년 차 베테랑 외식업 마케팅 전문가입니다. 사용자가 식당 메뉴 이름과 핵심 특징(재료 등)을 입력하면, 첫 번째는 인스타그램 감성에 맞는 감각적이고 매력적인 문구, 두 번째는 배달 앱(배민 등) 썸네일과 리뷰 유도에 어울리는 강렬한 후킹(Hooking) 문구, 세 번째는 당근마켓 동네 이웃들에게 친근하게 다가가는 지역 기반 홍보 문구를 작성하세요. 반드시 {"copies": ["문구1", "문구2", "문구3"]} 형태의 JSON으로만 응답해야 합니다.'
          },
          {
            role: 'user',
            content: `메뉴명: ${menuName || '셰프 특선'}\n재료: ${ingredients || '최상급 재료'}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) throw new Error(`OpenAI API Error: ${response.status}`);
    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    return NextResponse.json({ copies: content.copies });

  } catch (error) {
    console.error("GPT API 카피 생성 실패:", error);
    return NextResponse.json(
      { error: "카피 문구 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
