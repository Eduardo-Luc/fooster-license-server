const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

let db = JSON.parse(fs.readFileSync("keys.json"));

app.post("/validate", (req, res) => {

    const key = req.body.key;
    const hwid = req.body.hwid;

    if (!db[key]) {
        return res.json({ status: "invalid" });
    }

    let record = db[key];

    // primeira ativação
    if (record.hwid === "") {

        record.hwid = hwid;

        fs.writeFileSync("keys.json", JSON.stringify(db, null, 2));

        return res.json({ status: "ok" });
    }

    // mesmo PC
    if (record.hwid === hwid) {
        return res.json({ status: "ok" });
    }

    // outro PC
    return res.json({ status: "hwid_mismatch" });

});

app.listen(3000, () => {
    console.log("Fooster License Server running on port 3000");
});