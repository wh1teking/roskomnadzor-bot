#! /bin/bash

source .venv/bin/activate
uvicorn rkn_api:app --host 0.0.0.0 --port 8000
