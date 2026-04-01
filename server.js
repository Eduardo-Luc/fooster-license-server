const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const OWNER = "Eduardo-Luc";
const REPO = "fooster-license-server";
const FILE_PATH = "keys.json";
const BRANCH = "main";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// carregar banco do GitHub
async function loadDB() {

    const res = await axios.get(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
        {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github+json"
            }
        }
    );

    const content = Buffer.from(res.data.content, "base64").toString();

    return {
        db: JSON.parse(content),
        sha: res.data.sha
    };
}

// salvar banco no GitHub
async function saveDB(db, sha) {

    const content = Buffer.from(
        JSON.stringify(db, null, 2)
    ).toString("base64");

    await axios.put(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
        {
            message: "update hwid binding",
            content,
            sha,
            branch: BRANCH
        },
        {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github+json"
            }
        }
    );
}

// validação
app.post("/validate", async (req, res) => {

    try {

        const { key, hwid, type } = req.body;

        const { db, sha } = await loadDB();

        if (!db[key])
            return res.json({ status: "invalid" });

        if (!key.startsWith(type + "-"))
            return res.json({ status: "invalid_type" });

        const record = db[key];

        if (record.expires) {

            const today = new Date().toISOString().slice(0, 10);

            if (today > record.expires)
                return res.json({ status: "expired" });
        }

        if (!record.hwid || record.hwid === "") {

            record.hwid = hwid;

            await saveDB(db, sha);

            return res.json({ status: "ok" });
        }

        if (record.hwid === hwid)
            return res.json({ status: "ok" });

        return res.json({ status: "hwid_mismatch" });

    }
    catch (err) {

        console.log(err);

        return res.json({ status: "server_error" });
    }
});

// servidor

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log("Fooster License Server running on port " + PORT);
});
