export const goals = [
  "Generate Leads",
  "Enhance SEO Performance",
  "Establish Authority and Trust",
  "Increase Brand Awareness",
  "Foster Customer Engagement",
  "Improve Customer Education",
  "Boost Conversion Rates",
  "Nurture Leads",
];

export const languages = ["English", "Spanish", "German"];
export const searchIntents = [
  { value: "Random", label: "Random" },
  {
    value: "Informational",
    label: "Informational (Knowledge-based, Research)",
  },
  { value: "Navigational", label: "Navigational (Direct, Go)" },
  { value: "Transactional", label: "Transactional (Buy, Purchase)" },
  {
    value: "Commercial Investigation",
    label: "Commercial Investigation (Comparison, Consideration)",
  },
  { value: "Local", label: "Local (Near Me, Local Search)" },
];

// export const contentTypes = {
//   Review: "Template for writing a Review",
//   Editorial: "Template for creating an Editorial",
//   Interview: "Template for conducting an Interview",
//   "How To": "Template for writing How-To guides",
//   "Topic Introduction": "Template for introducing a Topic",
//   Opinion: "Template for expressing Opinions",
//   Research: "Template for documenting Research",
//   "Case Study": "Template for crafting a Case Study",
//   "Short Report": "Template for writing Short Reports",
//   "Think Piece": "Template for developing a Think Piece",
//   "Hard News": "Template for writing Hard News",
//   "First Person": "Template for First-Person narratives",
//   "Service Piece": "Template for creating Service Pieces",
//   Informational: "Template for crafting Informational articles",
// };

export const contentTypes = {
  Review:
    "Review Template\n\nIntroduction:\n- Provide a brief overview of the product/service being reviewed.\n- Mention the main purpose or use case.\n\nPros and Cons:\n- List the key advantages and benefits of the product/service.\n- List any drawbacks or disadvantages.\n\nDetailed Review:\n- Describe the product/service in detail, including features, performance, and usability.\n- Compare it with similar products/services in the market.\n- Share any personal experiences or insights.\n\nConclusion:\n- Summarize your overall opinion.\n- Recommend whether the product/service is worth purchasing and for whom.",
  Editorial:
    "Editorial Template\n\nIntroduction:\n- Introduce the topic or issue you are addressing.\n- Provide some background information and context.\n\nMain Argument:\n- Present your main argument or viewpoint.\n- Use supporting evidence, examples, and anecdotes.\n\nCounterarguments:\n- Address potential counterarguments or opposing views.\n- Refute them with logical reasoning and evidence.\n\nConclusion:\n- Summarize your main points.\n- Reiterate your stance and suggest any calls to action or next steps.",
  Interview:
    "Interview Template\n\nIntroduction:\n- Introduce the interviewee and their background.\n- Mention the purpose of the interview.\n\nQuestions and Answers:\n- Ask a series of questions and provide the interviewee's answers.\n- Include follow-up questions based on the interviewee's responses.\n\nConclusion:\n- Summarize key points discussed in the interview.\n- Provide any final thoughts or reflections.",
  "How To":
    "How To Template\n\nIntroduction:\n- Introduce the topic and explain the importance of the task.\n\nStep-by-Step Instructions:\n- List each step in a clear and logical order.\n- Provide detailed explanations and tips for each step.\n\nConclusion:\n- Summarize the process.\n- Offer any additional tips or considerations.",
  "Topic Introduction":
    "Topic Introduction Template\n\nIntroduction:\n- Introduce the topic and its relevance.\n- Provide some background information.\n\nKey Points:\n- Outline the main points related to the topic.\n- Include any important facts or statistics.\n\nConclusion:\n- Summarize the key points.\n- Suggest any further reading or actions.",
  Opinion:
    "Opinion Template\n\nIntroduction:\n- Introduce the topic and your viewpoint.\n\nMain Points:\n- Present your main points and arguments.\n- Support your points with evidence and examples.\n\nConclusion:\n- Summarize your viewpoint.\n- Suggest any calls to action or next steps.",
  Research:
    "Research Template\n\nIntroduction:\n- Introduce the research topic and its importance.\n\nMethods:\n- Describe the research methods used.\n\nFindings:\n- Present the main findings.\n\nConclusion:\n- Summarize the findings and their implications.",
  "Case Study":
    "Case Study Template\n\nIntroduction:\n- Introduce the subject of the case study.\n- Provide some background information.\n\nProblem:\n- Describe the problem or challenge faced.\n\nSolution:\n- Explain the solution implemented.\n\nResults:\n- Present the results of the solution.\n\nConclusion:\n- Summarize the key points and lessons learned.",
  "Short Report":
    "Short Report Template\n\nIntroduction:\n- Introduce the topic of the report.\n\nMain Points:\n- Present the main points of the report.\n\nConclusion:\n- Summarize the main points.",
  "Think Piece":
    "Think Piece Template\n\nIntroduction:\n- Introduce the topic and its relevance.\n\nMain Argument:\n- Present your main argument or viewpoint.\n\nSupporting Points:\n- Provide supporting points and evidence.\n\nConclusion:\n- Summarize your argument and suggest any calls to action.",
  "Hard News":
    "Hard News Template\n\nIntroduction:\n- Summarize the main facts of the news story.\n\nDetails:\n- Provide detailed information about the news event.\n\nConclusion:\n- Summarize the key points and any potential implications.",
  "First Person":
    "First Person Template\n\nIntroduction:\n- Introduce the topic and your personal connection to it.\n\nMain Story:\n- Tell your personal story or experience.\n\nConclusion:\n- Summarize the main points of your story.",
  "Service Piece":
    "Service Piece Template\n\nIntroduction:\n- Introduce the service and its importance.\n\nDetails:\n- Describe the service and how it works.\n\nBenefits:\n- List the key benefits of the service.\n\nConclusion:\n- Summarize the main points and recommend the service.",
  Informational:
    "Informational Template\n\nIntroduction:\n- Introduce the topic and its importance.\n\nMain Points:\n- Present the main points and information.\n\nConclusion:\n- Summarize the main points.",
};

export const contentStrategies = [
  {
    group: "Content Clusters and Pillar Pages",
    subgroups: [
      {
        value: "Topic Hubs and Resource Pages",
        label: "Topic Hubs and Resource Pages",
      },
      {
        value: "Thematic Groups and Hub Pages",
        label: "Thematic Groups and Hub Pages",
      },
      { value: "Cornerstone Content", label: "Cornerstone Content" },
    ],
  },
  {
    group: "Content Series",
    subgroups: [
      {
        value: "Ongoing Content Campaigns",
        label: "Ongoing Content Campaigns",
      },
      { value: "Serialized Content", label: "Serialized Content" },
    ],
  },
  {
    group: "Evergreen Content Creation",
    subgroups: [
      { value: "Long-Lasting Content", label: "Long-Lasting Content" },
      { value: "Seasonal Updates", label: "Seasonal Updates" },
    ],
  },
  {
    group: "Thought Leadership",
    subgroups: [
      { value: "Industry Insights", label: "Industry Insights" },
      { value: "Expert Opinions", label: "Expert Opinions" },
    ],
  },
  {
    group: "Keyword Clusters",
    subgroups: [
      { value: "Semantic Keywords", label: "Semantic Keywords" },
      { value: "Long-Tail Keywords", label: "Long-Tail Keywords" },
    ],
  },
  {
    group: "Buyers Journey",
    subgroups: [
      { value: "Full Journey", label: "Full Journey - Complete Funnel" },
      { value: "Awareness", label: "Awareness - Top of Funnel (TOFU)" },
      {
        value: "Consideration",
        label: "Consideration - Middle of Funnel (MOFU)",
      },
      { value: "Decision", label: "Decision - Bottom of Funnel (BOFU)" },
    ],
  },
  {
    group: "Single Article",
    subgroups: [
      { value: "Single Article", label: "Single Article" }, // Standalone without subgroups
    ],
  },
];
