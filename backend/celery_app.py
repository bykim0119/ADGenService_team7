import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://redis-service:6379/0")

celery_app = Celery(
    "ad_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks"],
)

celery_app.conf.update(
    result_expires=3600,          # 결과 1시간 보관
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,      # STARTED 상태 추적
    worker_prefetch_multiplier=1, # GPU 순차 처리
)
