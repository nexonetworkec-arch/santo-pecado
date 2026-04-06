import React from 'react';
import { Card, CardContent } from './ui/Card';

export const MediaSkeleton = () => (
  <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="overflow-hidden glass-card border-none animate-pulse">
        <div className="aspect-square w-full bg-white/5" />
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-white/10" />
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-white/10" />
                <div className="h-2 w-16 rounded bg-white/10" />
              </div>
            </div>
            <div className="h-8 w-16 rounded-full bg-white/10" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-white/10" />
            <div className="h-3 w-2/3 rounded bg-white/10" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const ProfileSkeleton = () => (
  <div className="min-h-screen pb-20 animate-pulse">
    <div className="h-48 w-full bg-white/5 md:h-64" />
    <div className="container mx-auto max-w-5xl px-4">
      <div className="relative -mt-24 mb-8 flex flex-col items-center md:flex-row md:items-end md:space-x-6">
        <div className="h-40 w-40 rounded-full border-4 border-black/20 bg-white/10" />
        <div className="mt-6 flex-1 text-center md:mt-0 md:pb-4 md:text-left space-y-4">
          <div className="h-10 w-64 rounded bg-white/10 mx-auto md:mx-0" />
          <div className="h-6 w-32 rounded bg-white/10 mx-auto md:mx-0" />
          <div className="h-4 w-48 rounded bg-white/10 mx-auto md:mx-0" />
        </div>
        <div className="mt-6 flex space-x-3 md:mt-0 md:pb-4">
          <div className="h-11 w-32 rounded bg-white/10" />
          <div className="h-11 w-11 rounded bg-white/10" />
        </div>
      </div>
      <div className="mb-8 h-px bg-white/10" />
      <div className="space-y-8">
        <div className="h-8 w-48 rounded bg-white/10" />
        <MediaSkeleton />
      </div>
    </div>
  </div>
);
