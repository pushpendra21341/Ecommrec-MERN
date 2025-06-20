const axios = require("axios");

const verifyCaptcha = async (captchaToken) => {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
    params: {
      secret,
      response: captchaToken,
    },
  });

  return response.data.success;
};

module.exports = verifyCaptcha;
