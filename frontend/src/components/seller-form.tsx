"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Camera, X, Upload, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { LoadScript, Autocomplete } from "@react-google-maps/api";

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters" }),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a positive number",
  }),
  location: z.string().min(3, { message: "Location is required" }),
});

// TODO: Replace with your Google Maps API key
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
console.log(`GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY}`);
const libraries: ["places"] = ["places"];

export default function SellerForm() {
  const [image, setImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(!GOOGLE_MAPS_API_KEY);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn(
        "Google Maps API key is missing. Location autocomplete will not work."
      );
      setIsApiKeyMissing(true);
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      location: "",
    },
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast("Camera Error");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageDataUrl = canvas.toDataURL("image/jpeg");
        setImage(imageDataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  // Handle place selection from Google Maps Autocomplete
  const onPlaceSelected = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();

      if (place && place.formatted_address) {
        form.setValue("location", place.formatted_address, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!image) {
      toast("Image Required");
      return;
    }

    // Prepare data for submission
    const listingData = {
      ...values,
      price: Number.parseFloat(values.price),
      image: image, // This is already base64 encoded
    };

    try {
      // Send data to your API
      console.log(`here is the form data: ${JSON.stringify(listingData)}`);
      // const response = await fetch("/api/listings", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(listingData),
      // });

      // if (response.ok) {
      //   toast("Success! Your item has been listed for sale");

      //   // Reset form
      //   form.reset();
      //   setImage(null);
      // } else {
      //   throw new Error("Failed to submit listing");
      // }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast("Submission Failed D:");
    }
  };

  const renderFormContent = () => (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <Label>Item Photo</Label>

        {!image && !isCameraActive && (
          <div className="flex gap-4">
            <Button type="button" onClick={startCamera} className="flex-1">
              <Camera className="mr-2 h-4 w-4" />
              Take Photo
            </Button>

            <div className="relative flex-1">
              <Button
                type="button"
                className="w-full"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Photo
              </Button>
              <Input
                id="file-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        )}

        {isCameraActive && (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-md border border-input"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute top-2 right-2"
                onClick={stopCamera}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button type="button" onClick={captureImage} className="w-full">
              Capture Photo
            </Button>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {image && (
          <div className="relative">
            <img
              src={image || "/placeholder.svg"}
              alt="Item preview"
              className="w-full h-auto rounded-md border border-input"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute top-2 right-2 bg-stone-50"
              onClick={removeImage}
            >
              <X className="h-4 w-4 text-stone-50" />
            </Button>
          </div>
        )}
      </div>

      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="What are you selling?" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe your item (condition, age, features, etc.)"
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Price</FormLabel>
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-2.5">$</span>
                <Input className="pl-6" placeholder="0.00" {...field} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location</FormLabel>
            <FormControl>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                {isApiKeyMissing ? (
                  <>
                    <Input
                      className="pl-9"
                      placeholder="Your city or neighborhood"
                      {...field}
                    />
                    <p className="text-xs mt-1 text-yellow-600">
                      Location autocomplete unavailable.
                    </p>
                  </>
                ) : (
                  <Autocomplete
                    onLoad={(autocomplete) => {
                      autocompleteRef.current = autocomplete;
                    }}
                    onPlaceChanged={onPlaceSelected}
                    options={{
                      componentRestrictions: { country: "us" },
                    }}
                  >
                    <Input
                      className="pl-9"
                      placeholder="Your city or neighborhood"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                      }}
                    />
                  </Autocomplete>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button type="submit" className="w-full">
        List Item for Sale
      </Button>
    </form>
  );

  return (
    <Card className="p-6">
      {!isApiKeyMissing ? (
        <LoadScript
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
          libraries={libraries}
        >
          <Form {...form}>{renderFormContent()}</Form>
        </LoadScript>
      ) : (
        <Form {...form}>{renderFormContent()}</Form>
      )}
    </Card>
  );
}
