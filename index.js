const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const axios = require("axios");
const http = require("http");
const https = require("https");

const apiId = 28596369;
const apiHash = "f50cfe3b10da015b2c2aa0ad31414a55";
const sessionKey = "1BQANOTEuMTA4LjU2LjE2MgG7nYhgq1uYJDBXEd7fNh0kOrxbW42XGF9eGRyYVcEa2kS/RlJThoIpJl4GoOAwXJs5maSe2sIOs0T4Qg51RuYVdRF80Gl/jCo1TsMBpSJ5pYOc+wYssZ61OF+dtrWIeXstRcrJazgIaJSWa9kqwaQbuhYYnQOmo0NaiVhOI50awaNR005RBuJ7OkWak/EWw+PfsdJ+cSmhR3Fh8rrENGqfk/gjsdMd6ruVpPo+Gj0gBIB+lecbpIzRqv4D7oXWnRhMuTMd/1jczfiO/iBcHpJjsJU970D0Tm8JljqA45W8LI1Trq9ed9JzL93PJSWBs1XdpYVG1+4xBovjlxnS5du0tA==";
const stringSession = new StringSession(sessionKey);

const apiUrl = "https://colorwiz.cyou/mana/receive_red_packet";
const client = new TelegramClient(stringSession, apiId, apiHash, {});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Reuse keep-alive agent to speed up HTTP requests
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const sendRedeemRequest = async (mobile, packetCode) => {
    try {
        const response = await axios.post(apiUrl, { mobile, packet_code: packetCode }, {
            headers: { "Content-Type": "application/json", "Connection": "keep-alive" },
            timeout: 10000,  // Shorter timeout to catch failures quickly
            httpAgent,
            httpsAgent,
        });
        return response.data;
    } catch (error) {
        console.error(`Error sending POST request: ${error.message}`);
    }
};

const handleRedeemResponse = async (client, data, username) => {
    let responseMessage;
    if (data?.msg) {
        responseMessage = `Not your luck ${username}: ${data.msg}`;
    } else if (data?.price) {
        responseMessage = `Hurry ${username} WON: ${data.price}`;
    } else {
        responseMessage = "Response not received properly";
    }
    console.log(responseMessage);
    await client.sendMessage("me", { message: responseMessage });
};

const extractRedeemCode = (text) => {
    const codeMatch = text.match(/gift\?c=([A-Za-z0-9]{24})/);
    return codeMatch ? codeMatch[1] : null;
};

// Optimize memory and CPU usage
const resetMemoryAndServices = async () => {
    console.warn("Memory threshold exceeded. Restarting services and clearing memory...");
    await client.disconnect();
    if (global.gc) {
        global.gc(); // Trigger garbage collection if exposed
    }
    lastMessageIds = { "@colorwiz_bonus": null, "@testinggroupbonustaken": null };
    await client.connect();
    console.log("Services restarted and memory cleared.");
};

const monitorMemoryUsage = async () => {
    const memoryUsage = process.memoryUsage();
    const usedMemoryMB = memoryUsage.rss / (1024 * 1024); // Convert bytes to MB
    if (usedMemoryMB > 230) {  // Adjust to your memory limit
        await resetMemoryAndServices();
    }
};

const startBot = async () => {
    await client.connect();
    let lastMessageIds = { "@colorwiz_bonus": null, "@testinggroupbonustaken": null };

    while (true) {
        try {
            await monitorMemoryUsage(); // Monitor memory usage

            const channels = ["@colorwiz_bonus", "@testinggroupbonustaken"];

            // Fetch messages concurrently to speed up the process
            const messagePromises = channels.map(channel => client.getMessages(channel, { limit: 1 }));
            const messagesArray = await Promise.all(messagePromises);

            const tasks = messagesArray.map(async (messages, index) => {
                if (messages.length > 0) {
                    const latestMessage = messages[0];
                    const channel = channels[index];

                    if (lastMessageIds[channel] === null || latestMessage.id > lastMessageIds[channel]) {
                        lastMessageIds[channel] = latestMessage.id;

                        const redeemCode = extractRedeemCode(latestMessage.message);
                        if (redeemCode) {
                            try {
                                const data = await sendRedeemRequest("+917015957516", redeemCode);
                                await handleRedeemResponse(client, data, "Ankush");
                            } catch (error) {
                                console.error(`Error handling redeem response: ${error.message}`);
                            }
                        }
                    }
                }
            });

            await Promise.all(tasks); // Execute all tasks concurrently
            await delay(950); // Adjust delay as needed

        } catch (err) {
            console.error("Error fetching messages: ", err);
            await delay(5000); // Backoff strategy
        }
    }
};

// Health check and self-ping mechanisms
const createHealthCheckServer = () => {
    http.createServer((req, res) => {
        if (req.url === "/health") {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("OK");
        } else {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not Found");
        }
    }).listen(8080, () => {
        console.log("Health check server is running on port 8080");
    });
};

const keepAppAwake = () => {
    setInterval(() => {
        https.get("https://telebotankushgc1-jl3xbahe.b4a.run/health", (res) => {
            console.log("Self-ping: ", res.statusCode);
        }).on("error", (err) => {
            console.error("Error in self-ping: ", err.message);
        });
    }, 10 * 60 * 1000); // Ping every 10 minutes
};

const init = async () => {
    createHealthCheckServer();
    keepAppAwake();
    await startBot();
};

init();


// const { TelegramClient } = require("telegram");
// const { StringSession } = require("telegram/sessions");
// const axios = require("axios");
// const http = require("http"); // Add HTTP for health check

// const apiId = 28596369;
// const apiHash = "f50cfe3b10da015b2c2aa0ad31414a55";
// const sessionKey = "1BQANOTEuMTA4LjU2LjE2MgG7Er6KEIrdNBy/2isic6Mp37b6Ijeopge0hE2lJJKMcrsoUUkYWPQCHOAeJvgpxUfKd3akRvQaz5HVNWaR5xdqpPkwrsEGMtaqZH9dij4f6lbXV/aCgkH34nBxykXZYfUhAQDH1lJ5/TMuNkgT6lS0V3nzURMR7nQxb5HZ5DjzWlUC/k8h/4askKGf+qGC85krCfqCtXlJt2plV3qKad5f6pJISIc7fyBNsphzZsknJFvTzDbOwOtjKIqRX+q0+V4fDrWZm5nIEmmK4yECMX2FSIzf4z8ug+xmuIYaFnFrw3cUrm1MxCOPgwYEkCk+v/8/3n4TapLEgBojPZa0Rz49Cw=="
// const stringSession = new StringSession(sessionKey);

// const apiUrl = "https://colorwiz.cyou/mana/receive_red_packet";
// const client = new TelegramClient(stringSession, apiId, apiHash, {});

// const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// const sendRedeemRequest = async (mobile, packetCode) => {
//   try {
//     const response = await axios.post(apiUrl, { mobile, packet_code: packetCode }, {
//       headers: { "Content-Type": "application/json", "Connection": "keep-alive" },
//       timeout: 30000, 
//     });
//     return response.data;
//   } catch (error) {
//     console.error(`Error sending POST request: ${error.message}`);
//   }
// };

// const handleRedeemResponse = async (client, data, username) => {
//   let responseMessage;
//   if (data.msg) {
//     responseMessage = `Not your luck ${username}: ${data.msg}`;
//   } else if (data.price) {
//     responseMessage = `Hurry ${username} WON: ${data.price}`;
//   } else {
//     responseMessage = "Response not received properly";
//   }
//   console.log(responseMessage);
//   await client.sendMessage("me", { message: responseMessage });
// };

// const extractRedeemCode = (text) => {
//   const codeMatch = text.match(/gift\?c=([A-Za-z0-9]{24})/);
//   return codeMatch ? codeMatch[1] : null;
// };

// (async () => {
//   await client.connect();
//   let lastMessageId = null;

//   while (true) {
//     try {
//       const messages = await client.getMessages("@colorwiz_bonus", { limit: 1 });
//       if (messages.length > 0) {
//         const latestMessage = messages[0];
//         if (lastMessageId === null || latestMessage.id > lastMessageId) {
//           lastMessageId = latestMessage.id;
//           const redeemCode = extractRedeemCode(latestMessage.message);
//           if (redeemCode) {
//             try {
//               const data = await sendRedeemRequest("+917015957516", redeemCode);
//               await handleRedeemResponse(client, data, "Ankush");
//             } catch (error) {
//               console.error(`Error handling redeem response: ${error.message}`);
//             }
//           }
//         }
//       }
//       await delay(900); 
//     } catch (err) {
//       console.error("Error fetching messages: ", err);
//       await delay(5000); 
//     }
//   }
// })();

// // Minimal HTTP server for health checks
// const server = http.createServer((req, res) => {
//   if (req.url === "/health") {
//     res.writeHead(200, { "Content-Type": "text/plain" });
//     res.end("OK");
//   } else {
//     res.writeHead(404, { "Content-Type": "text/plain" });
//     res.end("Not Found");
//   }
// });

// server.listen(8080, () => {
//   console.log("Health check server is running on port 8080");
// });

// // Self-ping logic to prevent sleep
// const keepAppAwake = () => {
//   setInterval(async () => {
//     try {
//       http.get("http://telebotankush3-75ynqnx9.b4a.run/health", (res) => {
//         console.log("Self-ping: ", res.statusCode);
//       }).on("error", (err) => {
//         console.error("Error in self-ping: ", err.message);  // Improved error handling
//       });
//     } catch (err) {
//       console.error("Caught error during self-ping: ", err);
//     }
//   }, 25 * 60 * 1000); // Every 25 minutes
// };

// keepAppAwake();


