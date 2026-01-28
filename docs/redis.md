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

## Run on Kubernetes (Rancher, no auth, no persistence)

```bash
kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bes-redis-oss-vercel
  namespace: aidc-dev
spec:
  replicas: 1
  selector:
    matchLabels:
      app: bes-redis-oss-vercel
  template:
    metadata:
      labels:
        app: bes-redis-oss-vercel
    spec:
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: redis
          image: redis:7
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              drop:
                - ALL
          ports:
            - containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: bes-redis-oss-vercel
  namespace: aidc-dev
spec:
  type: NodePort
  selector:
    app: bes-redis-oss-vercel
  ports:
    - name: redis
      port: 60063
      nodePort: 31371
      targetPort: 6379
EOF
```

## Connect

```bash
redis-cli -h localhost -p 6379
```
