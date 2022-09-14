import express from "express"
const PORT = 3001;
const app = express();

app.get("/api/v1", (_, res) => {
  res.send("hello !!!! world");
});

app.listen(PORT, () => console.log(`start listening on port : ${PORT}`));