const mailjet = require("node-mailjet").apiConnect(
  process.env.MAIL_JET_PUBLIC_KEY,
  process.env.MAIL_JET_PRIVATE_KEY,
);

const sendEmail = async (email) => {
  if (process.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`Sending email to ${email}...`);
    return;
  }

  try {
    const result = await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: email.senderEmail ?? "service-notification@uerm.edu.ph",
            Name: email.senderName ?? "UERM Service Notification",
          },
          To: [
            {
              Email: `${email.address ?? email.email}`,
              Name: `${email.name}`,
            },
          ],
          Cc: email.cc
            ? email.cc.map((cc) => ({
                Email: cc.email,
                Name: cc.name || "",
              }))
            : [], // optional CC list
          TemplateID: email.templateId ?? 4088864,
          TemplateLanguage: true,
          Subject: `${email.subject}`,
          Variables: {
            ehrHeader: `${email.header}`,
            ehrContent: `${email.content}`,
          },
          Attachments: email.attachments || [],
        },
      ],
    });
    return result.body;
  } catch (err) {
    console.log(err);
    return err.statusCode;
  }
};

module.exports = {
  sendEmail,
};
