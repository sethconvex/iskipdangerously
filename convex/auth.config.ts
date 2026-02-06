const authConfig = {
  providers: [
    {
      domain: process.env.WORKOS_CLIENT_ID
        ? `https://api.workos.com/user_management/${process.env.WORKOS_CLIENT_ID}`
        : "https://api.workos.com/",
      applicationID: "convex",
    },
  ],
};

export default authConfig;
