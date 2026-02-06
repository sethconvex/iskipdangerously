"use client";

import { fal } from "@fal-ai/client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, Wand2 } from "lucide-react";

fal.config({ proxyUrl: "/api/fal/proxy" });

const MODELS = [
  { id: "fal-ai/flux/dev", label: "FLUX Dev" },
  { id: "fal-ai/flux-pro/v1.1", label: "FLUX Pro" },
  { id: "fal-ai/flux-pro/v1.1-ultra", label: "FLUX Pro Ultra" },
  { id: "fal-ai/ideogram/v2", label: "Ideogram v2" },
];

const PROMPT_SUGGESTIONS = [
  "A lobster surfing a giant wave of code",
  "A lobster in a tuxedo at a fancy AI gala",
  "A lobster debugging spaghetti code at 3am",
  "A lobster riding a rocket through cyberspace",
  "A lobster as a superhero saving the internet",
  "A lobster DJ at a rave with laser eyes",
];

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const startGeneration = useMutation(api.designs.startGeneration);
  const completeGeneration = useMutation(api.designs.completeGeneration);
  const failGeneration = useMutation(api.designs.failGeneration);
  const designs = useQuery(api.designs.getUserDesigns);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsGenerating(true);

    const fullPrompt = `T-shirt design, bold graphic illustration style, vibrant colors, suitable for screen printing on a t-shirt: ${prompt.trim()}. Include a red lobster character as the mascot. White background.`;

    const generations = MODELS.map(async (model) => {
      let designId;
      try {
        designId = await startGeneration({
          prompt: prompt.trim(),
          model: model.label,
        });

        const result = await fal.subscribe(model.id, {
          input: {
            prompt: fullPrompt,
            image_size: "square_hd",
            num_images: 1,
          },
          pollInterval: 3000,
          logs: true,
        });

        const imageUrl = (result.data as any).images[0].url;
        await completeGeneration({ designId, imageUrl });
      } catch (error) {
        console.error(`Generation failed for ${model.label}:`, error);
        if (designId) {
          await failGeneration({ designId });
        }
      }
    });

    await Promise.allSettled(generations);
    setIsGenerating(false);
    toast.success("All models finished!");
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-8">
          <Sparkles className="h-10 w-10 text-purple-500 mx-auto mb-3" />
          <h1 className="text-3xl font-bold mb-2">AI Design Studio</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Describe a t-shirt design and our AI will generate it across 4
            models so you can compare. Every design features our lobster mascot.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Describe your design</Label>
                <textarea
                  id="prompt"
                  placeholder="e.g. A lobster riding a skateboard through a matrix of code..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  maxLength={2000}
                  disabled={isGenerating}
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                />
                <Button
                  type="submit"
                  disabled={isGenerating || !prompt.trim()}
                  className="gap-2 w-full sm:w-auto"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating 4 models...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>

              {/* Prompt suggestions */}
              <div className="flex flex-wrap gap-2">
                {PROMPT_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setPrompt(suggestion)}
                    className="text-xs px-3 py-1.5 rounded-full border hover:bg-muted transition-colors"
                    disabled={isGenerating}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Designs gallery */}
        <h2 className="text-xl font-semibold mb-4">Your Designs</h2>

        {designs === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : designs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Wand2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No designs yet. Enter a prompt above to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {designs.map((design) => (
              <Card key={design._id} className="overflow-hidden">
                {design.status === "complete" && design.imageUrl ? (
                  <img
                    src={design.imageUrl}
                    alt={design.prompt}
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                ) : design.status === "generating" ? (
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
                      {design.model && (
                        <p className="text-xs text-muted-foreground">
                          {design.model}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <Badge variant="destructive">Failed</Badge>
                  </div>
                )}
                <CardContent className="pt-3 pb-3">
                  {design.model && (
                    <Badge variant="secondary" className="mb-1.5">
                      {design.model}
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {design.prompt}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
