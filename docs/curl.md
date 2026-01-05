You can request in this generic curl way.

```bash
curl -N http://localhost:3000/api/chat \
-H "Content-Type: application/json" \
-H "Accept: text/event-stream" \
-d '{
    "model": "openai/gpt-5",
    "messages": [
        {
            "id": "msg-1",
            "role": "user",
            "parts": [
                { "type": "text", "text": "What is the current capacity of data center XAP?" }
            ]
        }
    ]
}'
```


Most important stream outputs are these.

```bash
...

data: {"type":"tool-input-delta","toolCallId":"call_jLK0gkKakEl8iAqh6auGUB3s","inputTextDelta":"."}

data: {"type":"tool-input-delta","toolCallId":"call_jLK0gkKakEl8iAqh6auGUB3s","inputTextDelta":"66"}

data: {"type":"tool-input-delta","toolCallId":"call_jLK0gkKakEl8iAqh6auGUB3s","inputTextDelta":"}"}

data: {"type":"tool-input-available","toolCallId":"call_jLK0gkKakEl8iAqh6auGUB3s","toolName":"FinalizeReport","input":{"sql":"SELECT SUM(rack_capacity) AS \"rack_capacity (sum)\"\nFROM opendcim.cabinet_status\nWHERE data_center = 'XAP'","csvBase64":"cmFja19jYXBhY2l0eSAoc3VtKQoxNjg=","preview":[{"rack_capacity (sum)":"168"}],"vegaLite":{},"narrative":"Data center XAP currently shows a total rack capacity of 168 rack units based on the latest cabinet_status snapshot. This is the sum of rack_capacity across every cabinet assigned to XAP, so it represents the installed rack space rather than power or floor capacity. No null values or outliers appeared in this pull, but the result set contains a single aggregated record with no timestamp field, so I'm assuming the snapshot reflects the most recent state of the site. Confidence: 0.66 because the calculation depends on that assumption about what “capacity” means and on the freshness of the snapshot.","confidence":0.66},"providerMetadata":{"openai":{"itemId":"fc_09cacff906b47cf200695b558dd7e881909bda342fb3377e07"}}}

data: {"type":"tool-output-available","toolCallId":"call_jLK0gkKakEl8iAqh6auGUB3s","output":{"sql":"SELECT SUM(rack_capacity) AS \"rack_capacity (sum)\"\nFROM opendcim.cabinet_status\nWHERE data_center = 'XAP'","csvBase64":"cmFja19jYXBhY2l0eSAoc3VtKQoxNjg=","preview":[{"rack_capacity (sum)":"168"}],"vegaLite":{},"narrative":"Data center XAP currently shows a total rack capacity of 168 rack units based on the latest cabinet_status snapshot. This is the sum of rack_capacity across every cabinet assigned to XAP, so it represents the installed rack space rather than power or floor capacity. No null values or outliers appeared in this pull, but the result set contains a single aggregated record with no timestamp field, so I'm assuming the snapshot reflects the  mostrecent state of the site. Confidence: 0.66 because the calculation depends on that assumption about what “capacity” means and on the freshness of the snapshot.","confidence":0.66}}

data: {"type":"finish-step"}

data: {"type":"finish"}

data: [DONE]
```