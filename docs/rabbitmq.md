RabbitMQ AMQP URL quick notes

AMQP URL format
```text
amqp://user:pass@host:5672/vhost
```

What `@` means
- The `@` separates credentials from the host.
- Everything before `@` is username and password (`user:pass`).
- Everything after `@` is the host (and optional port).
- If your username or password contains special characters, URL-encode them.
  Example: password `pa@ss` becomes `pa%40ss`.

What is a vhost
- A vhost (virtual host) is a namespace inside RabbitMQ that isolates queues,
  exchanges, bindings, and permissions.
- The vhost is the path portion of the URL.

Common vhost cases
- Default vhost is `/` and must be URL-encoded as `%2F`:
  ```text
  amqp://user:pass@host:5672/%2F
  ```
- Example custom vhost `myapp`:
  ```text
  amqp://user:pass@host:5672/myapp
  ```

CLI test (direct AMQP) with `amqp-tools`
1) Install (Debian/Ubuntu):
   ```bash
   sudo apt-get install amqp-tools
   ```
2) Test round-trip:
   ```bash
   export AMQP_URL="amqp://user:pass@host:5672/vhost"

   amqp-declare-queue -u "$AMQP_URL" -q test-cli
   amqp-publish -u "$AMQP_URL" -r test-cli -b "hello"
   amqp-consume -u "$AMQP_URL" -q test-cli -c 1
   ```

If `amqp-consume` prints `hello`, the URL works.

CLI test (management HTTP API) with `rabbitmqadmin`
Note: This uses the HTTP management plugin, not AMQP.
1) Enable the management plugin on the server.
2) Download rabbitmqadmin from the management UI.
3) Test:
   ```bash
   rabbitmqadmin -u user -p pass -H host -P 15672 list vhosts
   ```
