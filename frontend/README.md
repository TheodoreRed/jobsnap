# Frontend

## Environment variables

Set the API host with a Vite env var so API requests are never sent to a relative `/api` route.

```bash
VITE_API_BASE_URL=https://fn-jobsnap-stg.azurewebsites.net
```

`VITE_BASE_URL` is still accepted as a legacy fallback, but `VITE_API_BASE_URL` should be preferred.
