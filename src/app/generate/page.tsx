"use client";

import { fal } from "@fal-ai/client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, Wand2, Shirt } from "lucide-react";
import { SHIRT_SIZES, DEFAULT_SHIRT_PRICE } from "@/lib/constants";

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
  const createFromDesign = useMutation(api.products.createFromDesign);
  const designs = useQuery(api.designs.getUserDesigns);

  const [publishDesignId, setPublishDesignId] = useState<Id<"designs"> | null>(
    null
  );
  const [publishTitle, setPublishTitle] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsGenerating(true);

    const fullPrompt = `Bold graphic t-shirt design, streetwear aesthetic, clean lines, limited vibrant color palette, screen-print ready: ${prompt.trim()}. Feature a cool cartoon red lobster character. Meme-worthy and viral. Text: "I SKIP DANGEROUSLY". White background, isolated design.`;

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

  async function handlePublish() {
    if (!publishDesignId || !publishTitle.trim()) return;
    setIsPublishing(true);
    try {
      await createFromDesign({
        designId: publishDesignId,
        title: publishTitle.trim(),
        description:
          "AI-generated design printed on a Bella+Canvas 3001 Unisex Jersey. 100% cotton, comfortable fit.",
        price: DEFAULT_SHIRT_PRICE,
        sizes: SHIRT_SIZES,
      });
      toast.success("T-shirt is now in the shop!");
      setPublishDesignId(null);
      setPublishTitle("");
    } catch (error) {
      toast.error("Failed to publish — are you signed in?");
    } finally {
      setIsPublishing(false);
    }
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
            models so you can compare. Pick your favorite and sell it in the
            shop.
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
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    {design.model && (
                      <Badge variant="secondary">{design.model}</Badge>
                    )}
                    {design.status === "complete" && design.imageUrl && (
                      <Dialog
                        open={publishDesignId === design._id}
                        onOpenChange={(open) => {
                          if (open) {
                            setPublishDesignId(design._id);
                            setPublishTitle("");
                          } else {
                            setPublishDesignId(null);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
                            <Shirt className="h-3 w-3" />
                            Sell
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Sell as T-Shirt</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <img
                              src={design.imageUrl}
                              alt={design.prompt}
                              className="w-full max-h-64 object-contain rounded-lg"
                            />
                            <div className="space-y-2">
                              <Label htmlFor="title">T-Shirt Name</Label>
                              <Input
                                id="title"
                                placeholder="e.g. Lobster Hacker Tee"
                                value={publishTitle}
                                onChange={(e) =>
                                  setPublishTitle(e.target.value)
                                }
                                maxLength={100}
                              />
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>
                                Price: $
                                {(DEFAULT_SHIRT_PRICE / 100).toFixed(2)}
                              </p>
                              <p>
                                Sizes: {SHIRT_SIZES.join(", ")}
                              </p>
                              <p>
                                Printed on Bella+Canvas 3001 Unisex Jersey
                              </p>
                            </div>
                            <Button
                              onClick={handlePublish}
                              disabled={
                                isPublishing || !publishTitle.trim()
                              }
                              className="w-full gap-2"
                            >
                              {isPublishing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Shirt className="h-4 w-4" />
                              )}
                              Add to Shop
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
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
