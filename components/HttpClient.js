require("dotenv").config();
const axios = require("axios");
const https = require('https')

const instance = axios.create({
    timeout: 10000,
    httpsAgent: new https.Agent({ keepAlive: true }),
});

const userAgents = [
    "Mozilla/5.0 (Linux; Android 13; SM-A127M Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.6045.114 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/440.0.0.31.105;]",
    "Mozilla/5.0 (Linux; Android 12; SM-N970F Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/96.0.4664.92 Mobile Safari/537.36 Instagram 307.0.0.34.111 Android (31/12; 480dpi; 1080x2046; samsung; SM-N970F; d1; exynos9825; pt_BR; 532277880)",
    "Mozilla/5.0 (Linux; Android 10; POCOPHONE F1 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.0.0 Mobile Safari/537.36 Instagram 308.0.0.36.109 Android (29/10; 440dpi; 1080x2027; Xiaomi; POCOPHONE F1; beryllium; qcom; pt_BR; 534961954)",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/20G75 Instagram 308.0.2.18.106 (iPhone14,7; iOS 16_6; pt_BR; pt; scale=3.00; 1170x2532; 533874066) NW/3",
    "Mozilla/5.0 (Linux; Android 12; 220333QNY Build/SKQ1.211103.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.6045.64 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/439.0.0.44.117;]",
    "Mozilla/5.0 (Linux; Android 11; M2003J15SC Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/98.0.4758.101 Mobile Safari/537.36 Instagram 307.0.0.34.111 Android (30/11; 440dpi; 1080x2196; Xiaomi/Redmi; M2003J15SC; merlin; mt6768; pt_BR; 532277880)",
    "Mozilla/5.0 (Linux; Android 13; SM-A515F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.6045.66 Mobile Safari/537.36 Instagram 308.0.0.36.109 Android (33/13; 450dpi; 1080x2177; samsung; SM-A515F; a51; exynos9611; pt_BR; 534961954)",
    "Mozilla/5.0 (Linux; Android 10; M2006C3MII Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.0.0 Mobile Safari/537.36 Instagram 307.0.0.34.111 Android (29/10; 320dpi; 720x1449; Xiaomi/Redmi; M2006C3MII; cattail; mt6765; pt_BR; 532277848)",
    "Mozilla/5.0 (Linux; Android 11; M1908C3JGG Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.6045.66 Mobile Safari/537.36 Instagram 308.0.0.36.109 Android (30/11; 461dpi; 1080x2130; Xiaomi/Redmi; M1908C3JGG; biloba; mt6768; pt_BR; 534961954)",
    "Mozilla/5.0 (Linux; Android 9; Redmi Note 8 Pro Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.6045.66 Mobile Safari/537.36 Instagram 307.0.0.34.111 Android (28/9; 440dpi; 1080x2134; Xiaomi/Redmi; Redmi Note 8 Pro; begonia; mt6785; es_US; 532277880)",
];

instance.interceptors.request.use(config => {
    const userAgent = userAgents[Math.floor(Math.random()*userAgents.length)];
    config.headers['User-Agent'] = userAgent;
    return config;
});

module.exports = instance;
