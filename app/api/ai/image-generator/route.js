import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: "Replicate API token is missing." },
        { status: 500 },
      );
    }

    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Please enter an image prompt." },
        { status: 400 },
      );
    }

    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt: prompt.trim(),
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "webp",
      },
    });

    const imageUrl = output?.[0]?.url?.();

    if (!imageUrl) {
      throw new Error("Image generation returned no image.");
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Image generation error:", error);

    return NextResponse.json(
      { error: error.message || "Image generation failed." },
      { status: 500 },
    );
  }
}
