from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.core.database import engine
from app.models.models import Base
from app.routers.auth import router as auth_r
from app.routers.users import router as users_r
from app.routers.tasks import router as tasks_r
from app.routers.meetings import router as meetings_r
from app.routers.notif_dash import notif_router, dash_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="EMS Office API", version="2.0", docs_url="/api/docs", redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_r,     prefix="/api/auth",          tags=["Auth"])
app.include_router(users_r,    prefix="/api/users",         tags=["Users"])
app.include_router(tasks_r,    prefix="/api/tasks",         tags=["Tasks"])
app.include_router(meetings_r, prefix="/api/meetings",      tags=["Meetings"])
app.include_router(notif_router,prefix="/api/notifications",tags=["Notifications"])
app.include_router(dash_router, prefix="/api/dashboard",    tags=["Dashboard"])

# Serve React build in production
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR,"assets")), name="assets")
    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        return FileResponse(os.path.join(STATIC_DIR,"index.html"))

@app.get("/api")
def root():
    return {"status":"ok","version":"2.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
