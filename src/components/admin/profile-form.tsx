"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownIcon, ArrowUpIcon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { useId } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/admin/api-client";
import { queryKeys } from "@/lib/admin/resources";
import {
  type ProfileDTO,
  type ProfileInput,
  profileSchema,
  SOCIAL_PLATFORMS,
} from "@/lib/validations/portfolio";

import { Field, FormSection } from "./form/field";
import { ImageGallery } from "./form/image-gallery";
import { ImageUpload } from "./form/image-upload";
import { handleFormError } from "./form/server-errors";
import { TagInput } from "./form/tag-input";
import { useUnsavedChanges } from "./hooks/use-unsaved-changes";
import { PageHeader } from "./page-header";
import { ErrorState, ListSkeleton } from "./states";

const ENDPOINT = "/api/admin/profile";

const PLATFORM_LABELS: Record<(typeof SOCIAL_PLATFORMS)[number], string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  x: "X / Twitter",
  instagram: "Instagram",
  youtube: "YouTube",
  email: "Email",
  website: "Website",
  other: "Other",
};

function defaults(profile: ProfileDTO | null): ProfileInput {
  return {
    name: profile?.name ?? "",
    headline: profile?.headline ?? "",
    roles: profile?.roles ?? [],
    bio: profile?.bio ?? "",
    profileImage: profile?.profileImage ?? null,
    heroImages: profile?.heroImages ?? [],
    location: profile?.location ?? "",
    locationUrl: profile?.locationUrl ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    availability: profile?.availability ?? "",
    socialLinks: profile?.socialLinks ?? [],
  };
}

export function ProfileEditor() {
  const profile = useQuery({ queryKey: queryKeys.profile, queryFn: () => api<ProfileDTO | null>(ENDPOINT) });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your name, introduction, contact details and social links across the site."
      />
      {profile.isPending ? (
        <ListSkeleton rows={4} />
      ) : profile.isError ? (
        <ErrorState message={profile.error.message} onRetry={() => profile.refetch()} />
      ) : (
        <ProfileForm key={profile.data?.updatedAt ?? "new"} profile={profile.data} />
      )}
    </div>
  );
}

function ProfileForm({ profile }: { profile: ProfileDTO | null }) {
  const qc = useQueryClient();
  const formId = useId();
  const { register, control, handleSubmit, reset, setError, formState } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults(profile),
    mode: "onTouched",
  });
  const { errors, isDirty, isSubmitting } = formState;
  const links = useFieldArray({ control, name: "socialLinks" });
  useUnsavedChanges(formId, isDirty && !isSubmitting);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await api<ProfileDTO>(ENDPOINT, { method: "PATCH", json: values });
      reset(defaults(saved));
      qc.setQueryData(queryKeys.profile, saved);
      toast.success("Profile saved");
    } catch (error) {
      handleFormError(error, setError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 pb-24">
      <FormSection title="Identity" description="Shown in the hero section of your homepage.">
        <Field label="Profile picture">
          <Controller
            control={control}
            name="profileImage"
            render={({ field }) => (
              <ImageUpload value={field.value} onChange={field.onChange} folder="profile" shape="circle" label="photo" />
            )}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
          </Field>
          <Field
            label="Availability"
            htmlFor="availability"
            error={errors.availability?.message}
            hint="e.g. “Open to full-time roles”. Leave empty to hide."
          >
            <Input id="availability" {...register("availability")} />
          </Field>
        </div>
        <Field label="Headline" htmlFor="headline" required error={errors.headline?.message} hint="The sentence under “Hi, I'm …”.">
          <Textarea id="headline" rows={2} aria-invalid={!!errors.headline} {...register("headline")} />
        </Field>
        <Field
          label="Rotating roles"
          htmlFor="roles"
          error={errors.roles?.message}
          hint="Cycle under your name with a scramble effect. Press Enter to add."
        >
          <Controller
            control={control}
            name="roles"
            render={({ field }) => (
              <TagInput id="roles" value={field.value} onChange={field.onChange} max={8} placeholder="Full-stack developer…" />
            )}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Hero ASCII portrait"
        description="The homepage portrait is drawn in characters and morphs between these photos. Centered portraits with plain or transparent (PNG) backgrounds look best. Empty = profile picture."
      >
        <Controller
          control={control}
          name="heroImages"
          render={({ field }) => (
            <ImageGallery
              images={field.value}
              onChange={({ images }) => field.onChange(images)}
              folder="profile"
              aspect="portrait"
              max={6}
              label="Hero images"
            />
          )}
        />
        {errors.heroImages?.message && <p className="text-xs text-destructive">{errors.heroImages.message}</p>}
      </FormSection>

      <FormSection title="About" description="The About section. Markdown supported.">
        <Field label="Bio" htmlFor="bio" error={errors.bio?.message}>
          <Textarea id="bio" rows={8} {...register("bio")} />
        </Field>
      </FormSection>

      <FormSection title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" aria-invalid={!!errors.email} {...register("email")} />
          </Field>
          <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
            <Input id="phone" type="tel" aria-invalid={!!errors.phone} {...register("phone")} />
          </Field>
          <Field label="Location" htmlFor="location" error={errors.location?.message}>
            <Input id="location" {...register("location")} />
          </Field>
          <Field label="Location link" htmlFor="locationUrl" error={errors.locationUrl?.message}>
            <Input id="locationUrl" type="url" placeholder="https://maps.google.com/…" {...register("locationUrl")} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Social links" description="Links marked “In dock” appear in the floating navigation bar.">
        {links.fields.length === 0 && <p className="text-sm text-muted-foreground">No links yet.</p>}
        <ul className="space-y-3">
          {links.fields.map((link, index) => {
            const err = errors.socialLinks?.[index];
            return (
              <li key={link.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[9rem_9rem_1fr_auto] sm:items-start">
                <NativeSelect aria-label={`Link ${index + 1} platform`} {...register(`socialLinks.${index}.platform`)}>
                  {SOCIAL_PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {PLATFORM_LABELS[p]}
                    </option>
                  ))}
                </NativeSelect>
                <Input placeholder="Label" aria-label={`Link ${index + 1} label`} aria-invalid={!!err?.label} {...register(`socialLinks.${index}.label`)} />
                <div>
                  <Input placeholder="https:// or mailto:" aria-label={`Link ${index + 1} URL`} aria-invalid={!!err?.url} {...register(`socialLinks.${index}.url`)} />
                  {(err?.label || err?.url) && (
                    <p className="mt-1 text-xs text-destructive">{err.label?.message ?? err.url?.message}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <label className="mr-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Controller
                      control={control}
                      name={`socialLinks.${index}.showInNav`}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} aria-label={`Show link ${index + 1} in dock`} />
                      )}
                    />
                    In dock
                  </label>
                  <Button type="button" variant="ghost" size="icon" className="size-8 rounded-md" disabled={index === 0} onClick={() => links.move(index, index - 1)} aria-label="Move up">
                    <ArrowUpIcon className="size-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="size-8 rounded-md" disabled={index === links.fields.length - 1} onClick={() => links.move(index, index + 1)} aria-label="Move down">
                    <ArrowDownIcon className="size-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="size-8 rounded-md hover:text-destructive" onClick={() => links.remove(index)} aria-label={`Remove link ${index + 1}`}>
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={links.fields.length >= 20}
          onClick={() => links.append({ platform: "github", label: "", url: "", showInNav: true })}
        >
          <PlusIcon className="size-3.5" /> Add link
        </Button>
      </FormSection>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/90 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <p className="font-mono text-xs text-muted-foreground" aria-live="polite">
            {isSubmitting ? "Saving…" : isDirty ? "Unsaved changes" : "All changes saved"}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={!isDirty || isSubmitting} onClick={() => reset()}>
              Discard
            </Button>
            <Button type="submit" size="sm" disabled={!isDirty || isSubmitting} className="min-w-28">
              {isSubmitting ? <Loader2Icon className="size-4 animate-spin" /> : "Save profile"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
