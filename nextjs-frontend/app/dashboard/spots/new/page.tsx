import SpotForm from "@/components/spots/spot-form";

export default function NewSpotPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Create a new spot</h1>
        <p className="text-muted-foreground">
          Register a new shrine, temple, or museum and optionally upload images
          for it.
        </p>
      </div>
      <SpotForm />
    </div>
  );
}
