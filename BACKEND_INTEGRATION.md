# EcoDrive AI — Backend Integration

## Architecture

React/Vite frontend
  -> FastAPI `/api/eco-drive/analyze`
  -> deterministic local EcoDrive pipeline
  -> vehicle analysis
  -> driving analysis
  -> Gradient Boosting fuel prediction
  -> route comparison
  -> trip carbon impact
  -> optimization
  -> Eco Performance Score

The Google ADK root agent remains available in `eco_drive_agent/agent.py`.
The current FastAPI analysis endpoint intentionally uses the deterministic
pipeline so the UI can receive structured numerical results reliably.

## Backend

From the project root:

```powershell
python -m pip install -r requirements.txt
python -m uvicorn eco_drive_agent.api:app --host 127.0.0.1 --port 8000 --reload
```

Health endpoint:

`http://127.0.0.1:8000/api/health`

## Frontend

Open a second terminal:

```powershell
cd frontend\ecodrive-ui
npm install
npm run dev
```

The frontend uses:

`VITE_API_URL=http://127.0.0.1:8000`

If this value is omitted, that URL is used automatically.

## Google ADK

The ADK agent requires a Google API key in:

`eco_drive_agent/.env`

Use `.env.example` as the template. Never commit the real key.

## ML model

The fuel prediction tool loads:

- `ml/fuel_prediction_model.joblib`
- `ml/model_features.joblib`

The model is a Gradient Boosting Regressor trained on the project's current
prototype dataset.

## Notes

- Route calculations are prototype estimates, not live navigation results.
- CO2 values are prototype tailpipe estimates using the project's configured
  emission factors.
- The Eco Performance Score is a project-defined indicator.
- The ML prediction is based on the project's synthetic training dataset.
