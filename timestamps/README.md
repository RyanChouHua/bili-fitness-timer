# Timestamp Library

每个文件对应一个 Bilibili 视频 BV 号，命名规则：

```text
timestamps/<BV号>.json
```

脚本在线导入时只请求当前 BV 号对应的文件，例如：

```text
https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main/timestamps/BV1xx411c7mD.json
```

推荐字段：

```json
{
  "bvid": "BV1xx411c7mD",
  "title": "Optional title",
  "rawInput": "Push Up 00:12-00:28 3x8-12 rest45",
  "exercises": [
    {
      "name": "Push Up",
      "start": 12,
      "end": 28,
      "sets": 3,
      "minReps": 8,
      "maxReps": 12,
      "restSeconds": 45
    }
  ]
}
```
