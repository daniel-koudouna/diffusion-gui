import React, { useState } from "react";
import Spinner from "../components/spinner";
import { ModelResult } from "../components/model_result";
import { readdirSync, readFileSync } from "fs";
import { DateTime } from "luxon";
import { glob } from "glob";
import Image from "next/future/image";

export default function Home(props: { results: ModelResult[] }) {
  const [query, setQuery] = useState("");
  const [liveResults, setResults] = useState<ModelResult[]>(props.results);
  const [isLoading, setLoading] = useState(false);

  const payload = {
    prompt: query,
    num_outputs: 5,
  };

  const displayTime = (time: number) => {
    const t = DateTime.fromMillis(time);
    if (t.diffNow().hours == 0) {
      return "Less than an hour ago";
    }
    return t.toRelative();
  };

  const handleClick = () => {
    if (isLoading) {
      return;
    }

    setLoading(true);
    fetch("/api/image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((resp) => resp.json())
      .then((data) => {
        console.log(data);
        setResults((prev) => [data, ...prev]);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  return (
    <div className="absolute top-0 left-0 min-h-screen min-w-full bg-primary">
      <div className="bg-white relative rounded-lg m-20 ml-48 mr-48 p-5 flex flex-col items-center">
        <h2 className="text-3xl text-primary font-bold pb-4">
          Macdoniel - Stable Diffusion
        </h2>
        <div className="w-full text-center mb-3">
          {/* <label htmlFor="prompt">Prompt</label> */}
          <input
            className="border-primary border rounded-md text-lg text-center font-semibold p-1 w-2/3"
            id="prompt"
            placeholder="Prompt"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="w-full content-center justify-center p-1 text-center items-center">
          <button
            onClick={handleClick}
            className="bg-primary text-white rounded-md w-1/5 h-10"
          >
            {!isLoading && <span>Generate</span>}
            {isLoading && (
              <span className="relative">
                Generating images...
                <span className="absolute -left-8">
                  <Spinner className="fill-white" />
                </span>
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white relative rounded-lg m-20 ml-48 mr-48 p-5 flex flex-col text-center">
        <h2 className="font-bold text-4xl mb-10">History</h2>
        {liveResults
          .sort((a, b) => b.timestamp - a.timestamp)
          .map((res, i) => (
            <div key={res.run_id}>
              <div>
                <span className="text-2xl font-bold self-start">
                  {res.prompt}
                </span>
                <span className="text-xs m-4">{res.run_id}</span>
              </div>
              <div className="col-span-2 flex flex-col">
                <span>{displayTime(res.timestamp)}</span>
              </div>
              <div className="flex mr-3 ml-3">
                {res.blobs.map((blob, i) => (
                  <div
                    key={`image-${res.run_id}-${i}`}
                    className="flex-grow relative"
                  >
                    <Image
                      alt=""
                      className="w-64 m-1"
                      src={`/${blob}`}
                      width={512}
                      height={512}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export async function getStaticProps(context: any) {
  const jsonFiles = glob.sync("public/data/**/*.json");
  const results = jsonFiles.map((f) => {
    const data = JSON.parse(readFileSync(f).toString());
    return data as ModelResult;
  });

  return {
    props: {
      results: results,
    }, // will be passed to the page component as props
  };
}
