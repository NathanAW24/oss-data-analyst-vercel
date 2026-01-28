# Redis (Docker)

## Run (no auth, no persistence)

```bash
docker run -d --name redis \
  -p 6379:6379 \
  redis:7
```

## Run (no auth, persistence enabled)

```bash
docker run -d --name redis \
  -p 6379:6379 \
  redis:7 redis-server --appendonly yes
```

## Connect

```bash
redis-cli -h localhost -p 6379
```
