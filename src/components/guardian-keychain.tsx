'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneOff, MapPin, ShieldAlert, Wifi, BatteryFull, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { runPanicDetection } from '@/app/actions';
import type { DetectPanicAndAlertOutput } from '@/ai/flows/detect-panic-and-alert';
import { useToast } from '@/hooks/use-toast';

type Location = {
  latitude: number;
  longitude: number;
} | null;

const AlertLevelBadge = ({ level }: { level: 'low' | 'medium' | 'high' }) => {
  const levelStyles = {
    low: 'bg-green-500 hover:bg-green-500/90',
    medium: 'bg-yellow-500 hover:bg-yellow-500/90',
    high: 'bg-red-600 hover:bg-red-600/90',
  };
  return (
    <Badge className={`${levelStyles[level]} text-white`}>
      {level.charAt(0).toUpperCase() + level.slice(1)} Alert
    </Badge>
  );
};

export default function GuardianKeychain() {
  const [isCalling, setIsCalling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<Location>(null);
  const [panicInfo, setPanicInfo] = useState<DetectPanicAndAlertOutput | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const analysisInterval = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const videoPlaceholder = PlaceHolderImages.find((img) => img.id === 'keychain-view');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        toast({
          variant: 'destructive',
          title: 'Location Error',
          description: 'Could not retrieve your location.',
        });
      }
    );
  };

  const startAnalysis = () => {
    // Immediately run once
    performAnalysis();
    // Then set interval
    analysisInterval.current = setInterval(performAnalysis, 5000);
  };

  const stopAnalysis = () => {
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
      analysisInterval.current = null;
    }
  };

  const performAnalysis = async () => {
    // In a real app, we would get the data URI from a video stream.
    // For this demo, we pass a dummy string as the server action mocks the response.
    const result = await runPanicDetection('dummy-data-uri');
    setPanicInfo(result);
    if(result.panicDetected) {
       toast({
        title: `Panic Detected: ${result.alertLevel.toUpperCase()}`,
        description: `Actions taken: ${result.actionsTaken.join(', ')}`,
        variant: result.alertLevel === 'high' ? 'destructive' : 'default',
      });
    }
  };

  const startCall = () => {
    setIsLoading(true);
    setTimeout(() => {
      handleLocation();
      setIsCalling(true);
      setIsLoading(false);
      startAnalysis();
      toast({
        title: 'Call Started',
        description: 'You are now connected with your guardian.',
      });
    }, 1500);
  };

  const endCall = () => {
    setIsCalling(false);
    stopAnalysis();
    setPanicInfo(null);
    setLocation(null);
    toast({
      title: 'Call Ended',
    });
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopAnalysis();
    };
  }, []);

  return (
    <Card className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-200 dark:border-gray-800 bg-card">
      <CardHeader className="flex flex-row items-center justify-between p-3 bg-secondary/50">
        <div className="flex items-center gap-2">
          <Logo className="h-6 w-6 text-primary" />
          <CardTitle className="text-lg font-bold">Guardian</CardTitle>
        </div>
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <span>{currentTime}</span>
          <Wifi size={18} />
          <BatteryFull size={18} />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {!isCalling ? (
          <div className="flex flex-col items-center justify-center gap-8 p-8 min-h-[450px]">
            <div className="text-center">
              <h2 className="font-headline text-2xl font-bold text-foreground">In Case of Emergency</h2>
              <p className="text-muted-foreground">Press the button to call for help</p>
            </div>
            <Button
              onClick={startCall}
              disabled={isLoading}
              className="h-40 w-40 rounded-full bg-accent text-accent-foreground shadow-lg animate-pulse-strong flex flex-col gap-2 hover:bg-accent/90"
              aria-label="Start Emergency Call"
            >
              {isLoading ? (
                <Loader2 className="h-16 w-16 animate-spin" />
              ) : (
                <>
                  <Phone size={48} />
                  <span className="text-2xl font-bold">SOS</span>
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="min-h-[450px] flex flex-col">
            <div className="relative w-full aspect-video bg-gray-900">
              {videoPlaceholder && (
                <Image
                  src={videoPlaceholder.imageUrl}
                  alt={videoPlaceholder.description}
                  data-ai-hint={videoPlaceholder.imageHint}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                />
              )}
              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                LIVE 360° VIEW
              </div>
            </div>
            <div className="flex-grow p-4 space-y-4">
               <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-headline font-semibold">Location Shared</h3>
                  {location ? (
                     <p className="text-sm text-muted-foreground font-mono">
                      {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                    </p>
                  ) : (
                     <p className="text-sm text-muted-foreground">Getting coordinates...</p>
                  )}
                </div>
              </div>
               <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                <ShieldAlert className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-headline font-semibold">AI Safety Analysis</h3>
                   {panicInfo ? (
                    <div className="space-y-1 mt-1">
                      {panicInfo.panicDetected ? (
                        <>
                          <AlertLevelBadge level={panicInfo.alertLevel} />
                           <p className="text-xs text-muted-foreground">
                             Actions: {panicInfo.actionsTaken.join(', ').replace(/_/g, ' ')}
                           </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">No immediate threats detected.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Analyzing surroundings...</p>
                  )}
                </div>
              </div>
            </div>
             <CardFooter className="p-4">
                <Button onClick={endCall} variant="destructive" size="lg" className="w-full">
                  <PhoneOff className="mr-2 h-5 w-5" /> End Call
                </Button>
            </CardFooter>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
