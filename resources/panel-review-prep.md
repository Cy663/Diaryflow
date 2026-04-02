# FlowDiary Panel Review — 预期问题准备

基于评分标准和 Presentation 内容，按评分维度整理可能被问到的问题。

---

## 1. Understanding & Technical Knowledge (25 pts)

> 考察你对项目技术细节的理解深度，能否自信准确地解释。

### 所有人都可能被问到的

- **"Walk me through the data flow — from the moment GPS data enters the system to the final diary page the parent sees."**
  - 要点：GPS 输入 → clusterStays() 聚类（50m 半径，5min 最短停留）→ Google Places API 查地名和图片 → Gemini LLM 生成文字 → 组装 Diary JSON → 前端 DiaryDisplay 渲染
  - 能说出具体参数（50m、5min）会加分

- **"Why did you choose Google Places API over alternatives like OpenStreetMap?"**
  - Google Places 有照片、分类标签（school/park/restaurant）、更丰富的 POI 数据
  - OSM 没有照片，需要自己维护图片库
  - 但 Google 的缺点：学校内部空间（sensory room）查不到

- **"How does the GPS clustering algorithm work? What happens if two locations are very close together?"**
  - Haversine 公式算距离，50m 内归为一组，停留不到 5 分钟的被过滤掉
  - 两个很近的地方（如同一栋楼的不同教室）会被合并——这是已知局限

- **"Explain your privacy architecture. What specific design decisions ensure privacy?"**
  - GPS only → 不采集任何图像/音频
  - Stock image substitution → 不是拍了再模糊，而是从头就不拍
  - 照片上传是可选的、由教师主动操作
  - 数据存在本地 SQLite，不上传第三方

### Xu 可能被追问的

- **"You mentioned Choiceworks and existing tools. How is FlowDiary fundamentally different?"**
  - Choiceworks 是手动 setup（每天早上老师要配置），FlowDiary 是自动生成
  - Choiceworks 是 plan-ahead（提前告诉孩子今天要做什么），FlowDiary 是 recall-after（回忆今天做了什么）
  - 不同的使用场景，互补而非替代

- **"What if a parent uploads an inappropriate photo? How do you handle content moderation?"**
  - 目前没有自动审核机制——这是 future work
  - 可以用 Gemini 做 content safety check
  - 当前依赖教师角色权限（只有教师能上传）

### Shixing 可能被追问的

- **"Why a web app instead of a native mobile app?"**
  - 课程时间限制，web 开发迭代更快
  - 不需要 App Store 审核
  - 不需要真实 GPS 硬件和真实学生受试者
  - 未来可以用 PWA 或 React Native 迁移

- **"How does the fallback image system work when Google Places has no photo?"**
  - `image-fallback.ts` 按 place type 映射：school → 教室图片，park → 操场图片，restaurant → 餐厅图片
  - 有一个默认 fallback（校车图片）
  - 这保证了日记没有空白页

- **"What role does the LLM (Gemini) play in the system?"**
  - 三个用途：1) 从照片生成日记文字 2) 解析课程表图片 3) 判断照片适合性
  - 使用 Gemini 2.5 Flash Lite（通过 OpenRouter）
  - 所有 prompt 都限制在 30 词以内，适合特殊教育场景

### Zhixiao 可能被追问的

- **"How did you validate the accuracy of place name resolution?"**
  - 用真实温哥华地点坐标（Killarney Secondary School、A&W Canada 等）
  - 手动验证返回的地名是否正确
  - 商业场所准确率高，学校内部空间是薄弱点

- **"What metrics did you use to evaluate the generated diary?"**
  - 三个维度：地点序列正确性、停留时长准确性、图片相关性
  - 目前是定性评估（人工检查），不是量化测试

---

## 2. Clarity & Quality of Responses (20 pts)

> 考察回答是否清晰有条理。

### 回答策略

- **先总后分**：先给一句话总结，再展开细节
  - 差："嗯...我们用了 Google Places API，然后它返回一个 JSON，里面有 name 字段..."
  - 好："我们用 Google Places API 把 GPS 坐标翻译成人类可读的地名。具体来说..."

- **用类比**：如果被问到技术细节，用生活类比
  - GPS 聚类 → "就像你看一个人的手机定位记录，在同一个地方待了 20 分钟，那就是一个有意义的停留点"

- **承认不知道的时候要优雅**
  - "That's a great question. We haven't explored that specific area yet, but our current thinking is..."

---

## 3. Critical Thinking & Problem-Solving (15 pts)

> 考察能否多角度分析问题，讨论替代方案。

### 可能的分析性问题

- **"What are the ethical implications of tracking a child's location all day?"**
  - 我们的立场：GPS 数据只用于日记生成，不做实时追踪
  - 数据存在本地，不上传云端
  - 但承认这是 sensitive topic — 需要家长知情同意、学校伦理审批
  - 对比现状：老师用个人手机拍学生照片更不安全

- **"What if the system gets it wrong — shows the kid at McDonald's when they were actually at the library next door?"**
  - GPS 精度本身就是 ±10m，室内更差
  - 这就是为什么我们设计了 teacher review 环节——教师可以在生成前编辑日程
  - 未来方案：BLE beacons 做室内定位

- **"You're using AI-generated text for children with communication difficulties. What if the AI hallucinates?"**
  - Prompt 限制在 30 词以内，减少幻觉空间
  - 用第二人称 ("you did...") 和提问形式 ("What was your favorite part?")
  - 目的是 conversation starter，不是 factual record
  - 教师可以在生成后查看和验证

- **"Why not just use a camera with face-blurring? Isn't that simpler?"**
  - 对普通人是更简单，但对我们的用户群不行
  - 模糊的脸会让有认知障碍的孩子困惑——他们需要清晰、可识别的视觉线索
  - 而且相机方案有 bystander privacy 问题（其他孩子的家长没同意）
  - GPS-only 从根本上避免了这些问题

- **"How would you scale this to a classroom of 20 students?"**
  - 每个学生一个 GPS 设备（手表/追踪器）
  - 教师上传一次照片和课程表，系统为每个学生生成个性化日记（根据各自 GPS 路线）
  - 批量生成是服务端的事，不增加教师工作量

- **"What alternatives to Google Places did you consider?"**
  - Foursquare/Yelp API — 更偏商业场所
  - OpenStreetMap — 免费但没照片
  - 自建地点数据库 — 工作量太大
  - 选 Google 是因为覆盖最广 + 有照片 + 有类型标签

---

## 4. Receptiveness to Feedback & Professional Engagement (10 pts)

> 考察你是否虚心接受反馈、主动提问。

### 关键行为

- **被指出问题时不要辩解**，而是：
  - "That's a valid concern. We agree that [X] is a limitation, and here's how we'd address it..."
  
- **主动延伸**：
  - "To add to that point, one thing we discovered during implementation was..."

- **问 panelist 的意见**：
  - "Do you think [BLE beacons / NFC tags] would be the right approach for indoor resolution, or would you suggest something else?"

---

## 5. Team Cohesion & Collaborative Understanding (15 pts)

> 考察团队成员是否了解彼此的工作。

### 可能的跨角色问题

- **问 Xu："Can you explain how the GPS clustering works technically?"**
  - 即使是 Shixing 写的代码，Xu 也应该能说出 50m 半径 + 5min 阈值 + Haversine 距离

- **问 Shixing："Why did the team choose privacy-by-design over post-capture anonymization?"**
  - 即使是 Xu 讲的 privacy 部分，Shixing 也要能解释

- **问 Zhixiao："What does the system architecture look like?"**
  - 三层：Data Collection → Contextual Inference → Visualization

### 建议准备

每个人都应该能回答以下三个基本问题：
1. FlowDiary 解决什么问题？（30 秒版本）
2. 系统怎么工作的？（1 分钟版本）
3. 主要局限是什么？（30 秒版本）

---

## 6. Overall Project Vision & Research Direction (15 pts)

> 考察团队对项目整体方向的把握。

### 可能的 big-picture 问题

- **"Where does FlowDiary sit in the broader landscape of assistive technology?"**
  - 介于 AAC (Augmentative & Alternative Communication) 和 lifelogging 之间
  - AAC 工具帮孩子表达当下需求，FlowDiary 帮回忆过去的经历
  - 补充现有工具（Choiceworks/Goally），不是替代

- **"What's your research question or hypothesis?"**
  - "Can passive location data, combined with contextual inference, generate a visual diary that meaningfully supports parent-child communication for students with communication challenges — without capturing any sensitive data?"

- **"If you had another semester, what would you build next?"**
  - 优先级：1) BLE beacon 室内定位 2) 家长端互动功能（gamified review）3) 对话脚手架（vocabulary prompts）4) 周报/趋势分析
  - 以及用户研究：找真实的特教老师和家长做可用性测试

- **"How do you measure success for this project?"**
  - 短期：系统能否从 GPS 数据生成一份准确、隐私安全的视觉日记
  - 长期：家长是否觉得日记帮助了和孩子的沟通（需要 user study）
  - 最终目标：减少教师工作量 + 增强家庭连接

---

## 快速参考卡（每人打印一份）

| 问题类型 | 关键回答框架 |
|---------|------------|
| "How does X work?" | 总结一句 → 具体步骤 → 为什么这样选 |
| "Why not Y?" | 承认 Y 的优点 → 解释 Y 在我们场景下的局限 → 我们的方案如何更适合 |
| "What about limitation Z?" | 承认 → 当前的缓解措施 → future work 计划 |
| "What if..." | "Great question. In that scenario, our system would... and if that fails, we have..." |
| 不知道的问题 | "We haven't explored that yet, but based on our experience, we think... We'd love your input on that." |
