import { mkdirSync, writeFile, writeFileSync } from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { ModelResult } from "../../components/model_result";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const run_id = uuidv4();

  const prompt = req.body["prompt"];
  const num_outputs = req.body["num_outputs"] || 4;

  const payload = {
    input: {
      prompt: prompt,
    },
  };

  const getResp = (n: number, acc: string[] = []): Promise<string[]> =>
    fetch("http://localhost:5000/predictions", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((json) => {
        acc.push(json["output"][0]);
        if (n > 1) {
          return getResp(n - 1, acc);
        } else {
          return acc;
        }
      })
      .catch((err) => acc);

  const blobs = await getResp(num_outputs);
  const data: ModelResult = {
    run_id: run_id,
    prompt: prompt,
    blobs: blobs,
    timestamp: Date.now(),
  };
  mkdirSync(`public/data/${run_id}`);

  data.blobs.forEach((blob, idx) => {
    const blobData = Buffer.from(blob.split(",")[1], "base64");
    writeFileSync(`public/data/${run_id}/output-${idx}.png`, blobData);
  });
  data.blobs = data.blobs.map(
    (blob, idx) => `data/${run_id}/output-${idx}.png`
  );
  writeFileSync(`public/data/${run_id}/data.json`, JSON.stringify(data));
  res.status(200).json(data);
}
