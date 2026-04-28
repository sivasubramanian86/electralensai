
import os
from dotenv import load_dotenv
load_dotenv(override=True)

print("Testing DLP Client...")
from google.cloud import dlp_v2
try:
    client = dlp_v2.DlpServiceClient()
    print("DLP Client initialized successfully.")
except Exception as e:
    print(f"DLP Client init failed: {e}")

print("Testing Monitoring Client...")
from google.cloud import monitoring_v3
try:
    client = monitoring_v3.MetricServiceClient()
    print("Monitoring Client initialized successfully.")
except Exception as e:
    print(f"Monitoring Client init failed: {e}")

print("Testing Vertex AI init...")
import vertexai
try:
    vertexai.init(project=os.getenv("GOOGLE_CLOUD_PROJECT"), location="us-central1")
    print("Vertex AI initialized successfully.")
except Exception as e:
    print(f"Vertex AI init failed: {e}")

print("Testing Agent creation...")
from agents.root_agent import create_root_agent
try:
    root = create_root_agent()
    print("Root Agent created successfully.")
except Exception as e:
    print(f"Root Agent creation failed: {e}")

print("Testing Runner initialization...")
from google.adk import Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService
try:
    runner = Runner(
        app_name="ElectraLensAI",
        agent=root,
        session_service=InMemorySessionService(),
        auto_create_session=True,
    )
    print("Runner initialized successfully.")
except Exception as e:
    print(f"Runner initialization failed: {e}")
