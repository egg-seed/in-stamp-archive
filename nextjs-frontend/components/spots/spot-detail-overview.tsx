"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";

import SpotGalleryManager from "@/components/spots/spot-gallery-manager";
import SpotGoshuinGallery from "@/components/spots/spot-goshuin-gallery";
import SpotMap from "@/components/spots/spot-map";
import {
  GoshuinRecord,
  SPOT_IMAGE_TYPE_LABELS,
  SPOT_TYPE_LABELS,
  Spot,
  SpotImage,
} from "@/lib/spots";

interface SpotDetailOverviewProps {
  spot: Spot;
  images: SpotImage[];
  goshuin: GoshuinRecord[];
}

export default function SpotDetailOverview({
  spot,
  images,
  goshuin,
}: SpotDetailOverviewProps) {
  const [imageList, setImageList] = useState<SpotImage[]>(images);

  const heroImage = useMemo(
    () => imageList.find((image) => image.is_primary) ?? imageList[0],
    [imageList],
  );

  const supportingImages = useMemo(
    () => imageList.filter((image) => image.id !== heroImage?.id),
    [imageList, heroImage],
  );

  return (
    <div className="space-y-8">
      <article className="overflow-hidden rounded-2xl border bg-background shadow">
        {heroImage ? (
          <div className="relative h-72 w-full bg-muted">
            <img
              src={heroImage.image_url}
              alt={`${spot.name} hero image`}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-72 items-center justify-center bg-muted text-lg text-muted-foreground">
            No hero image uploaded yet.
          </div>
        )}
        <div className="grid gap-6 p-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <header>
              <h1 className="text-3xl font-semibold text-foreground">
                {spot.name}
              </h1>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">
                {SPOT_TYPE_LABELS[spot.spot_type] ?? spot.spot_type}
              </p>
            </header>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-foreground">Prefecture</dt>
                <dd className="text-muted-foreground">
                  {spot.prefecture ?? "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">City</dt>
                <dd className="text-muted-foreground">
                  {spot.city ?? "Not specified"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-medium text-foreground">Address</dt>
                <dd className="text-muted-foreground">
                  {spot.address ?? "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Website</dt>
                <dd className="text-muted-foreground">
                  {spot.website_url ? (
                    <a
                      href={spot.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {spot.website_url}
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Phone</dt>
                <dd className="text-muted-foreground">
                  {spot.phone_number ?? "Not provided"}
                </dd>
              </div>
            </dl>
          </div>
          <SpotMap
            latitude={spot.latitude}
            longitude={spot.longitude}
            address={spot.address}
          />
        </div>
      </article>

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Spot gallery</h2>
            <p className="text-sm text-muted-foreground">
              Upload, reorder, and choose a primary image for this location.
            </p>
          </div>
        </header>
        {imageList.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {heroImage ? (
              <figure
                key={heroImage.id}
                className="overflow-hidden rounded-xl border bg-background"
              >
                <img
                  src={heroImage.image_url}
                  alt={`${spot.name} primary image`}
                  className="h-48 w-full object-cover"
                />
                <figcaption className="flex items-center justify-between px-4 py-2 text-sm text-muted-foreground">
                  <span>Primary · {SPOT_IMAGE_TYPE_LABELS[heroImage.image_type]}</span>
                  <span className="text-xs">Order {heroImage.display_order + 1}</span>
                </figcaption>
              </figure>
            ) : null}
            {supportingImages.map((image) => (
              <figure
                key={image.id}
                className="overflow-hidden rounded-xl border bg-background"
              >
                <img
                  src={image.image_url}
                  alt={`${spot.name} image`}
                  className="h-48 w-full object-cover"
                />
                <figcaption className="flex items-center justify-between px-4 py-2 text-sm text-muted-foreground">
                  <span>{SPOT_IMAGE_TYPE_LABELS[image.image_type]}</span>
                  <span className="text-xs">Order {image.display_order + 1}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No images uploaded yet.
          </div>
        )}
        <SpotGalleryManager
          spotId={spot.id}
          images={imageList}
          onUpdated={setImageList}
        />
      </section>

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Related goshuin</h2>
            <p className="text-sm text-muted-foreground">
              Recent goshuin records linked to this spot.
            </p>
          </div>
        </header>
        <SpotGoshuinGallery records={goshuin} />
      </section>
    </div>
  );
}
