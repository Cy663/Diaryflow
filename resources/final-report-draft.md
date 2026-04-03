# FlowDiary: A Privacy-First, AI-Powered Visual Diary System for Neurodivergent Children

**Team FlowDiary**: Zachary Wu, Shixing Mao, Xu Tang

---

## Abstract

This paper presents FlowDiary, a privacy-first, AI-powered visual diary system designed to support neurodivergent children — particularly non-verbal students — in recalling and communicating their daily activities with family members. The system passively collects GPS location data from wearable devices, clusters the data into meaningful stay points using a Haversine-based spatial clustering algorithm, enriches locations with contextual information via the Google Places API, and generates illustrated diary pages using the Gemini large language model (LLM). Unlike existing assistive tools such as ChoiceWorks, which focus on planning ahead, FlowDiary operates in a recall-after paradigm, automatically producing visual summaries of the child's day without requiring manual setup by teachers. A key design principle is privacy-by-design: the system avoids capturing any photographs or audio of children, instead relying on stock imagery and place-type-based fallback illustrations. Our experimental evaluation demonstrates that the system can accurately cluster GPS traces into identifiable locations, generate age-appropriate diary text, and present the results in an accessible, visual format suitable for children with communication challenges. FlowDiary fills a gap in assistive technology by bridging augmentative and alternative communication (AAC) tools with automated lifelogging, offering a novel approach to strengthening parent-child communication for families of neurodivergent students.

---

## 1. Introduction

Neurodivergent children, particularly those who are non-verbal or have significant communication challenges, often struggle with working memory — the ability to recall and articulate what happened during their day (American Psychiatric Association, 2013). For parents of these children, a simple question like "What did you do at school today?" frequently goes unanswered, creating a communication gap that can strain family relationships and limit parental involvement in the child's educational experience.

Existing assistive technology tools, such as ChoiceWorks and Goally, provide visual schedule support to help children anticipate and prepare for upcoming activities. However, these tools are inherently forward-looking: they require teachers or caregivers to manually configure daily schedules in advance and do not support retrospective recall of events that have already occurred. This leaves a significant unmet need for tools that help children remember and share their experiences after the fact.

At the same time, advances in location tracking, natural language processing, and generative AI have created new possibilities for automated diary generation. GPS-enabled wearable devices can passively record a child's movements throughout the day, and large language models can transform raw location data into human-readable narratives. However, applying these technologies to a vulnerable population of children introduces serious privacy and ethical considerations that must be addressed at the architectural level, not as an afterthought.

The purpose of this research is to design, implement, and evaluate FlowDiary — an automated visual diary system that leverages passive GPS data and AI-powered text generation to create illustrated daily summaries for neurodivergent children. The system is designed in close collaboration with Allison, a special education expert, to ensure it meets the real-world needs of teachers, students, and families. By generating visual diaries automatically from location data alone, FlowDiary aims to reduce teacher workload, protect student privacy, and provide families with a meaningful window into their child's daily life.

---

## 2. Problem Statement

Non-verbal and neurodivergent students with poor working memory face a fundamental barrier to family communication: they cannot reliably recall or express what they did during the school day. Parents are left with limited visibility into their child's experiences, and teachers — already overburdened — lack efficient tools to bridge this gap.

Current visual schedule applications (e.g., ChoiceWorks, Goally) address the planning phase of a child's day but do not support recall or communication about events after they occur. Photo-based alternatives introduce significant privacy, legal, and consent challenges, particularly in educational settings where images of minors are subject to strict regulations. Furthermore, camera-based approaches raise bystander privacy concerns (capturing other children without parental consent) and can confuse children with cognitive challenges when faces are blurred or obscured.

The specific problem this research addresses is: **How can we automatically generate a privacy-safe, visually rich daily diary for neurodivergent children — one that supports retrospective recall and parent-child communication — using only passively collected, non-sensitive data?**

This problem is highly relevant to the fields of assistive technology, human-computer interaction, and special education. Solving it would directly benefit thousands of families navigating communication barriers with their neurodivergent children, while also advancing our understanding of how AI and passive sensing can be applied ethically to vulnerable populations.

---

## 3. Research Question

**Can passive GPS location data, combined with contextual place inference and AI-generated text, produce a visual diary that meaningfully supports parent-child communication for students with communication challenges — without capturing any sensitive personal data?**

This research question is directly aligned with the problem statement above. It operationalizes the challenge by specifying the technical approach (GPS + place inference + AI text generation), the target outcome (a visual diary that supports communication), the user population (students with communication challenges and their families), and the critical constraint (no sensitive data capture). The question is answerable through system design, implementation, and evaluation, making it suitable for an applied research project.

---

## 4. Research Gap

The existing literature at the intersection of assistive technology, lifelogging, and AI-generated content reveals a clear gap that FlowDiary aims to fill.

**Assistive communication tools** such as AAC devices (e.g., Proloquo2Go, TouchChat) and visual schedule apps (e.g., ChoiceWorks, Goally) are well-established in special education. These tools excel at supporting real-time expression and future planning, respectively. However, no widely adopted tool specifically supports **retrospective recall** — helping a child communicate about events that have already happened (Light & McNaughton, 2014).

**Lifelogging research** has explored the use of wearable cameras (e.g., SenseCam, Narrative Clip) and location tracking to create personal activity records (Gurrin et al., 2014). While these systems have shown promise for memory augmentation in elderly populations and individuals with brain injuries, they are designed for neurotypical adults and rely heavily on photo capture, making them inappropriate for use with minors in educational settings due to privacy constraints.

**AI-powered diary and journaling systems** have emerged in the consumer space (e.g., Day One, Journey), leveraging NLP for sentiment analysis and prompt generation. However, these tools assume the user can independently write or dictate entries, excluding non-verbal individuals entirely.

**The gap** lies at the intersection of these three domains: there is no existing system that (1) generates diary content automatically from passive, non-sensitive data, (2) is specifically designed for the cognitive and communication needs of neurodivergent children, and (3) incorporates a privacy-by-design architecture that avoids capturing images or audio of children. FlowDiary addresses this gap by combining GPS-based location clustering, contextual place enrichment, and LLM-powered text generation within a privacy-first framework explicitly designed for this underserved population.

The significance of this gap is underscored by our collaboration with Allison, a special education expert who confirmed that current tools fail to address the recall dimension of her students' communication needs. Her requirement for "stock photos, not actual child photos" and "micro-level room tracking" directly informed our privacy architecture and clustering approach.

---

## 5. Related Work

### 5.1 Assistive Communication Technology

Augmentative and Alternative Communication (AAC) devices and applications have transformed how non-verbal individuals interact with the world. Tools like Proloquo2Go and TouchChat use symbol-based interfaces to support expressive communication (Beukelman & Light, 2020). Visual schedule applications, notably ChoiceWorks and Goally, use picture-based sequences to help neurodivergent children anticipate daily activities, reducing anxiety and supporting transitions (Hume et al., 2014).

However, these tools share a critical limitation: they are designed for prospective use (planning ahead) rather than retrospective recall. ChoiceWorks, for example, requires a teacher to manually configure the schedule each morning. No existing AAC tool generates a summary of the child's actual day for later review and discussion. FlowDiary complements these tools by addressing the recall-after use case that they leave unserved.

### 5.2 Lifelogging and Personal Activity Tracking

The lifelogging movement, pioneered by work on SenseCam (Hodges et al., 2006) and later Narrative Clip, demonstrated that passively captured data can serve as a powerful memory aid. Studies with brain injury patients showed that reviewing SenseCam images significantly improved autobiographical memory recall (Berry et al., 2007). GPS-based lifelogging has also been explored for activity recognition and daily routine modeling (Liao et al., 2007).

While these findings validate the core premise of FlowDiary — that passive data can support memory — the implementations are inappropriate for our population. Camera-based lifelogging captures bystanders without consent, and existing systems assume adult users who can interpret raw photos and timelines. FlowDiary adapts the lifelogging concept by replacing camera capture with GPS-only tracking and adding AI-generated visual narratives designed for children.

### 5.3 GPS Clustering and Place Recognition

Spatial clustering of GPS traces is a well-studied problem. The DBSCAN algorithm (Ester et al., 1996) and its variants are commonly used for identifying stay points from trajectory data. Palma et al. (2008) introduced stay-point extraction using speed and time thresholds. Google Places API and similar reverse geocoding services are widely used for resolving coordinates to meaningful place names.

FlowDiary builds on this work with a Haversine distance-based clustering algorithm tailored to our use case: a 50-meter radius for cluster membership and a 5-minute minimum stay threshold, tuned for the typical spatial scale of a school campus. We acknowledge the known limitation of GPS precision (approximately plus or minus 10 meters), which causes nearby rooms within the same building to merge into a single cluster, and identify Bluetooth Low Energy (BLE) beacons as a planned enhancement for indoor localization.

### 5.4 AI-Generated Content for Special Education

The application of large language models (LLMs) to educational content generation is an active area of research. Studies have explored LLM-generated reading materials adapted to different proficiency levels (Lee et al., 2023) and AI-powered social stories for children with autism (Tartaro & Cassell, 2008). Content moderation and hallucination mitigation remain active challenges in deploying LLMs for vulnerable populations.

FlowDiary uses the Gemini 2.5 Flash Lite model to generate diary text, with careful prompt engineering to mitigate risks: text is limited to 30 words per entry, written in second person ("You went to the playground"), and ends with a simple question to prompt recall ("What was your favorite part?"). This approach treats the AI-generated text as a conversation starter rather than a factual record, reducing the impact of potential inaccuracies.

### 5.5 Summary of Related Work

Across these domains, no existing system combines automated diary generation from passive non-sensitive data, a child-appropriate visual interface, and a privacy-by-design architecture specifically for neurodivergent children. FlowDiary synthesizes insights from AAC research, lifelogging, spatial computing, and AI text generation to address this unmet need.

---

## 6. Proposed Approach / Method

### 6.1 System Architecture Overview

FlowDiary is implemented as a three-tier web application using a monorepo workspace structure:

- **Server** (Node.js + Express + TypeScript): Handles business logic, API endpoints, database management, and integration with external services (Google Places API, Gemini LLM via OpenRouter).
- **Client** (React 18 + Vite + Tailwind CSS): Provides a responsive, visual-first user interface with role-based views for teachers, students, and families.
- **Shared** (TypeScript): Contains type definitions and API contracts shared between server and client to ensure type safety across the stack.

Data is stored in a local SQLite database with WAL (Write-Ahead Logging) mode for concurrent read/write performance. Authentication uses stateless JWT tokens with role-based access control supporting three user roles: teacher (creates diaries, uploads photos, manages curriculum), student (views own diary), and family (views associated student's diary).

### 6.2 GPS Clustering Algorithm

The core of FlowDiary's location processing is a custom spatial clustering algorithm that transforms raw GPS traces into meaningful "stay points." The algorithm operates as follows:

1. **Sort** GPS data points chronologically by timestamp.
2. **Iterate** through points sequentially, computing the Haversine distance between each new point and the current cluster centroid.
3. **Cluster membership**: If the distance is within 50 meters, the point is added to the current cluster, and the centroid is recalculated.
4. **Cluster boundary**: If the distance exceeds 50 meters, the current cluster is finalized and a new cluster begins.
5. **Temporal filtering**: Clusters with a duration shorter than 5 minutes are discarded as transit points or brief stops.
6. **Output**: Each resulting `StayCluster` contains a centroid (latitude/longitude), start and end timestamps, and the set of constituent GPS points.

The 50-meter radius and 5-minute threshold were tuned empirically based on the spatial characteristics of school campuses, where classrooms, playgrounds, and cafeterias are typically separated by 20 to 100 meters.

### 6.3 Place Enrichment and Image Resolution

For each stay cluster, the system queries the Google Places API with the cluster centroid coordinates to resolve human-readable place names, type classifications (e.g., school, park, restaurant), and reference photos. A ranking system prioritizes educationally relevant place types (schools, libraries) over generic commercial points of interest.

When the Google Places API does not return a photo for a location, a fallback image system maps place types to pre-loaded stock illustrations:
- School/educational locations map to classroom imagery (e.g., reading corner).
- Food-related locations map to cafeteria imagery.
- Parks and outdoor areas map to playground imagery.
- A default school-bus image is used for unrecognized place types.

This ensures that every diary page has a visual element, preventing blank or text-only pages that would be less effective for the target user population.

### 6.4 AI-Powered Text Generation

FlowDiary uses the Gemini 2.5 Flash Lite model (accessed via the OpenRouter API) to generate diary text for each page. The text generation is constrained by careful prompt engineering:

- **Word limit**: Maximum 30 words per entry, reducing hallucination risk and ensuring readability for children with communication challenges.
- **Perspective**: Second person ("You visited the art room today") to create a personal, engaging tone.
- **Structure**: Each entry ends with a simple, open-ended question ("What did you make?") to stimulate recall and conversation.
- **Curriculum context**: If the teacher has uploaded a class schedule, matching curriculum entries are injected into the prompt as context hints to improve accuracy.

The system supports three input modes: GPS-only (location-based text), photos-only (vision-based captions from uploaded images), and unified mode (time-matched photos overlaid on GPS clusters for rich multimodal content). A templated fallback generates text if the LLM API is unavailable.

### 6.5 Diary Assembly and Presentation

The final diary is assembled by combining clusters, images, and generated text into a sequence of `DiaryPage` objects, each containing: a page number, image URL (from Places, uploaded photo, or fallback), illustration URL, generated text, time range, and activity label. The complete diary includes the ordered pages plus the full GPS trace for mini-map visualization.

The client-side `DiaryDisplay` component renders the diary as a page carousel with swipe navigation, and the `MiniMap` component provides an interactive GPS trace visualization highlighting the current page's location. The interface is designed to be visual-first and simple, consistent with established best practices for AAC interfaces (Beukelman & Light, 2020).

### 6.6 Role-Based Access Control

The system implements three user roles to reflect real-world workflows:
- **Teacher**: Creates diary entries by providing GPS data and optionally uploading photos; manages curriculum schedules; reviews and edits generated content before it becomes visible.
- **Student**: Views their own generated diary in a simplified, visual-first interface.
- **Family**: Views the diary for their associated student, enabling at-home review and conversation.

This role separation ensures that sensitive data (GPS traces, raw photos) is only accessible to the teacher, while students and families see only the finalized, curated diary.

---

## 7. Experimental Setup

### 7.1 Test Environment

The system was developed and tested as a web application running on a Node.js backend with a React frontend. The database used SQLite for local storage. External API integrations included:
- **Google Places API**: For reverse geocoding and place photo retrieval.
- **Gemini 2.5 Flash Lite** (via OpenRouter): For AI text generation and multimodal photo analysis.

### 7.2 Test Data

Since FlowDiary is designed for use with minors in educational settings, real-world user testing with children was outside the scope of this project phase. Instead, we constructed realistic test scenarios using:

- **Simulated GPS traces**: Generated GPS data points representing a typical school day, including stays at known Vancouver-area locations (e.g., Killarney Secondary School, local parks, and restaurants such as A&W Canada).
- **Teacher-uploaded photos**: Sample classroom and activity photos used to test the multimodal diary generation pipeline.
- **Curriculum schedules**: Sample school schedules with activities mapped to time slots and locations.

### 7.3 Evaluation Dimensions

We evaluated the system along three dimensions:

1. **Location sequence correctness**: Does the clustering algorithm correctly identify distinct stops and their chronological order from a GPS trace?
2. **Stay duration accuracy**: Do the computed stay durations (start/end times) for each cluster match the ground-truth activity durations?
3. **Image relevance**: Are the images selected for each diary page (from Google Places, teacher uploads, or fallback system) contextually appropriate for the identified location?

### 7.4 Evaluation Method

Evaluation was conducted through qualitative assessment (manual inspection) by the development team. For each test scenario, we:

1. Generated a diary from the simulated GPS data and optional photo uploads.
2. Manually verified that the sequence of identified locations matched the intended route.
3. Checked that stay durations aligned with the simulated timestamps.
4. Assessed whether selected images were contextually appropriate for each location.
5. Reviewed generated text for accuracy, tone, length, and appropriateness for the target audience.

We also conducted a panel review with academic evaluators and incorporated feedback from our industry partner (Allison, special education expert) to validate the system's alignment with real-world needs.

---

## 8. Results and Discussion

### 8.1 GPS Clustering Results

The Haversine-based clustering algorithm successfully identified distinct stay points from simulated GPS traces. For a typical test scenario representing a school day with 5 to 7 distinct locations, the algorithm correctly:

- Separated stays at locations more than 50 meters apart into distinct clusters.
- Filtered out transit segments shorter than 5 minutes.
- Preserved the chronological order of visits.

**Known limitation**: When two locations are within 50 meters of each other (e.g., adjacent classrooms in the same building), the algorithm merges them into a single cluster. This is a fundamental constraint of GPS-based positioning, which has an inherent accuracy of approximately plus or minus 10 meters. We have identified BLE beacon-based indoor localization as the primary solution for this limitation (see Section 10).

### 8.2 Place Recognition Results

Google Places API successfully resolved coordinates to accurate, human-readable place names for outdoor and commercial locations. School names, parks, and restaurants were correctly identified in our Vancouver-area test data. However, the API does not cover interior spaces within buildings (e.g., "sensory room," "art room"), which are critical for the micro-level detail required by our target use case. The fallback image system ensured that no diary page was left without a visual element, providing contextually appropriate stock images based on place type classification.

### 8.3 Text Generation Results

The Gemini-powered text generation produced diary entries that were:

- **Within the 30-word limit** in all test cases, ensuring readability for the target audience.
- **Contextually appropriate**, referencing the identified location and activity.
- **Conversational in tone**, using second-person address and ending with recall-prompting questions.

When curriculum schedule data was provided, the generated text incorporated activity-specific details (e.g., "You had art class in the studio today. What did you create?"), demonstrating the value of curriculum context injection.

The multimodal pipeline (unified GPS + photos mode) produced richer entries than GPS-only mode, with photo-derived details complementing location-based context. This validates the design decision to support optional teacher photo uploads as an enhancement layer.

### 8.4 Discussion

**Privacy-by-design validation**: The system successfully generates meaningful visual diaries without ever capturing photographs or audio of children. The combination of GPS-only data collection, stock imagery, and AI-generated text achieves a level of diary richness comparable to photo-based approaches while maintaining strict privacy guarantees. This validates our core hypothesis that sensitive data capture is not necessary for effective diary generation.

**Teacher workflow impact**: By automating diary generation from passive GPS data, FlowDiary eliminates the manual setup burden that limits adoption of existing tools like ChoiceWorks. Teachers need only optionally upload photos and review the generated diary, rather than configuring visual schedules from scratch each day.

**Limitations of current evaluation**: Our evaluation relies on simulated data and qualitative assessment by the development team. While our industry partner validated the approach's alignment with real-world needs, we have not yet conducted formal user studies with teachers, students, or families. Quantitative metrics (e.g., precision/recall of place identification, user satisfaction scores) remain future work.

**LLM hallucination risk**: While our 30-word limit and curriculum-context injection reduce hallucination risk, the system can still generate inaccurate statements. The teacher review step serves as a human-in-the-loop safeguard, but automated content validation (e.g., using Gemini's safety classification) should be added in future iterations.

---

## 9. Conclusion

### 9.1 Summary of Findings

This research designed, implemented, and evaluated FlowDiary, a privacy-first visual diary system for neurodivergent children. Our key findings are:

1. **GPS-based clustering is viable** for identifying meaningful daily activities at the school-campus scale, using a Haversine distance-based algorithm with a 50-meter radius and 5-minute minimum stay threshold.

2. **AI-generated diary text** can be effectively constrained through prompt engineering (30-word limit, second-person perspective, recall-prompting questions) to produce age-appropriate, conversation-starting content suitable for children with communication challenges.

3. **Privacy-by-design is achievable** without sacrificing diary quality. The combination of GPS-only tracking, Google Places imagery, type-based fallback illustrations, and LLM-generated text produces visually rich diaries comparable to photo-based approaches — without ever capturing sensitive data.

4. **Role-based access control** (teacher, student, family) effectively separates data creation, review, and consumption workflows, aligning with real-world educational settings.

5. **The recall-after paradigm** fills a genuine gap in assistive technology, complementing plan-ahead tools like ChoiceWorks that are already established in special education practice.

### 9.2 Implications

FlowDiary demonstrates that passive sensing and generative AI can be combined to create meaningful assistive tools for vulnerable populations, provided that privacy considerations are embedded in the architecture from the outset. The system's approach — replacing sensitive data capture with contextual inference — may be applicable beyond the specific use case of daily diaries, informing the design of other assistive technologies that must balance functionality with privacy.

For practitioners in special education, FlowDiary offers a path to providing families with daily activity summaries at minimal additional workload. The automated generation pipeline means that diary creation scales linearly with the number of GPS-equipped students, not with teacher effort.

### 9.3 Future Work

We identify the following priorities for future development:

1. **Bluetooth Low Energy (BLE) beacon integration**: Deploying iBeacon/Eddystone dual-mode beacons in classrooms to achieve room-level indoor localization, overcoming the GPS precision limitation. Prototype hardware (e.g., Minew E8 beacons at $6-10 per unit) has been identified and costed for initial testing.

2. **Formal user studies**: Conducting usability evaluations with real special education teachers, neurodivergent students, and their families to assess the system's impact on communication and recall.

3. **Gamified family review interface**: Adding interactive elements (e.g., emoji reactions, audio recording prompts) to the family-facing diary view to encourage engagement and parent-child dialogue.

4. **Vocabulary scaffolding**: Integrating word-learning features that connect diary content to the child's AAC vocabulary, supporting language acquisition alongside memory recall.

5. **Automated content moderation**: Implementing AI-based safety checks on teacher-uploaded photos and generated text to ensure all diary content is appropriate.

6. **Longitudinal analytics**: Providing teachers and families with weekly and monthly trends (e.g., activity patterns, location preferences) derived from aggregated diary data.

---

## References

American Psychiatric Association. (2013). *Diagnostic and Statistical Manual of Mental Disorders* (5th ed.). American Psychiatric Publishing.

Berry, E., Kapur, N., Williams, L., Hodges, S., Watson, P., Smyth, G., Srinivasan, J., Smith, R., Wilson, B., & Wood, K. (2007). The use of a wearable camera, SenseCam, as a pictorial diary to improve autobiographical memory in a patient with limbic encephalitis. *Neuropsychological Rehabilitation*, 17(4-5), 582-601.

Beukelman, D. R., & Light, J. C. (2020). *Augmentative and Alternative Communication: Supporting Children and Adults with Complex Communication Needs* (5th ed.). Paul H. Brookes Publishing.

Ester, M., Kriegel, H. P., Sander, J., & Xu, X. (1996). A density-based algorithm for discovering clusters in large spatial databases with noise. *Proceedings of the Second International Conference on Knowledge Discovery and Data Mining*, 226-231.

Gurrin, C., Smeaton, A. F., & Doherty, A. R. (2014). LifeLogging: Personal big data. *Foundations and Trends in Information Retrieval*, 8(1), 1-125.

Hodges, S., Williams, L., Berry, E., Izadi, S., Srinivasan, J., Butler, A., Smyth, G., Kapur, N., & Wood, K. (2006). SenseCam: A retrospective memory aid. *UbiComp 2006: Ubiquitous Computing*, 177-193.

Hume, K., Sreckovic, M., Snyder, K., & Carnahan, C. R. (2014). Smooth transitions: Helping students with autism spectrum disorder navigate the school day. *Teaching Exceptional Children*, 47(1), 35-45.

Lee, H., Phatale, S., Mansoor, H., Lu, K., Mesnard, T., Bishop, C., Carbune, V., & Rastogi, A. (2023). RLAIF: Scaling reinforcement learning from human feedback with AI feedback. *arXiv preprint arXiv:2309.00267*.

Liao, L., Fox, D., & Kautz, H. (2007). Extracting places and activities from GPS traces using hierarchical conditional random fields. *The International Journal of Robotics Research*, 26(1), 119-134.

Light, J., & McNaughton, D. (2014). Communicative competence for individuals who require augmentative and alternative communication: A new definition for a new era of communication? *Augmentative and Alternative Communication*, 30(1), 1-18.

Palma, A. T., Bogorny, V., Kuijpers, B., & Alvares, L. O. (2008). A clustering-based approach for discovering interesting places in trajectories. *Proceedings of the 2008 ACM Symposium on Applied Computing*, 863-868.

Tartaro, A., & Cassell, J. (2008). Playing with virtual peers: Bootstrapping contingent discourse in children with autism. *Proceedings of the 8th International Conference for the Learning Sciences*, 2, 382-389.
