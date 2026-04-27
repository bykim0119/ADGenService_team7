# Team7 Performance Measurement Notes

## Current commit

- Branch: `minchul/service-integration-baseline`
- Latest commit: `0c8323d perf: reduce ad latent size with prompt guardrails`

## Confirmed performance changes

| Commit / setup | Main change | Observed task total | Decision |
|---|---|---:|---|
| `1876df6` | ad steps `30 -> 24` | ~54.43s | baseline after step reduction |
| `5bf563d` | GPT prompt/copy merged into one request | ~46.38s–46.43s | kept |
| 768 latent, no prompt guardrails | ad latent `1024 -> 768` | 33.536s | fast but image too patterned |
| 768 latent + prompt guardrails | `768x768` + natural/organic prompt rules | 33.155s | kept |
| 1024 latent + same prompt guardrails | comparison run | polling elapsed 60.21s | slower, not clearly better |

## Bottleneck notes

Temporary Comfy timing showed the main bottlenecks were:

| Section | Approx time |
|---|---:|
| GPT | ~17s |
| Comfy wait | ~29s |
| queue | ~0.19s |
| fetch | ~0.38s |
| Comfy total | ~29.26s |
| task total | ~46.43s |

Queue/fetch/polling were not the main bottleneck.

## Steps experiment

| Steps | Result |
|---:|---|
| 24 | final quality baseline |
| 20 | no meaningful speed gain |
| 16 | faster, but image became too AI-rendered/plastic |
| 18 | noisy/weak candidate, not adopted |

Final step count remains `24`.

## Latent-size decision

The adopted change is:

- ad workflow latent size: `1024x1024 -> 768x768`
- steps remain `24`
- cfg remains `8.0`
- sampler remains `euler_ancestral`
- scheduler remains `karras`

The first 768 run was fast but produced visible stylized artifacts: perfect heart/concentric foam pattern, overly uniform layer bands, and object-like garnish.

A second 768 run added prompt guardrails in `generate_prompt_and_copy()`:

- prefer natural layered latte appearance
- prefer organic foam texture
- prefer casual cafe photography realism
- avoid perfect concentric patterns
- avoid perfect heart latte-art
- avoid overly graphic garnish placement
- avoid overly uniform horizontal layers

This kept the speed around 33s while improving the image toward a usable cafe menu-photo look.

## Important invalid/temporary items

Do not commit local measurement patches:

- `redis://localhost:6379/0`
- `http://127.0.0.1:8188`
- temporary `COMFY_TIMING` logs

Do not use failed measurements:

- ComfyUI connection refused
- stale/pending jobs after backend restart
- `failed_input`
- `failed_system`

## Port notes

- Team7 backend: `8000`
- Comfy local port-forward: `8188`
- User solo project: `8001` — do not touch
