'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneOff, MapPin, ShieldAlert, Wifi, BatteryFull, Loader2, Navigation, VideoOff, Users, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/logo';
import { runPanicDetection } from '@/app/actions';
import type { DetectPanicAndAlertOutput } from '@/ai/flows/detect-panic-and-alert';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const [hasGpsPermission, setHasGpsPermission] = useState<boolean | undefined>(undefined);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | undefined>(undefined);
  const [guardianCount, setGuardianCount] = useState(0);

  const analysisInterval = useRef<NodeJS.Timeout | null>(null);
  const locationWatcher = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    // Check for guardians in local storage
    const storedGuardians = localStorage.getItem('guardians');
    if (storedGuardians) {
      setGuardianCount(JSON.parse(storedGuardians).length);
    }
    
    // Listen for storage changes to update guardian count
    const handleStorageChange = () => {
        const storedGuardians = localStorage.getItem('guardians');
        setGuardianCount(storedGuardians ? JSON.parse(storedGuardians).length : 0);
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
        clearInterval(timer);
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions to show live video.',
        });
      }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasCameraPermission(undefined);
  }

  const startLocationTracking = () => {
    if (navigator.geolocation) {
      locationWatcher.current = navigator.geolocation.watchPosition(
        (position) => {
          setHasGpsPermission(true);
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setHasGpsPermission(false);
          toast({
            variant: 'destructive',
            title: 'Location Error',
            description: 'Could not retrieve your location. Please grant permission.',
          });
        }
      );
    } else {
      setHasGpsPermission(false);
      toast({
        variant: 'destructive',
        title: 'Location Error',
        description: 'Geolocation is not supported by this browser.',
      });
    }
  };

  const stopLocationTracking = () => {
    if (locationWatcher.current !== null) {
      navigator.geolocation.clearWatch(locationWatcher.current);
      locationWatcher.current = null;
    }
  };


  const startAnalysis = () => {
    performAnalysis();
    analysisInterval.current = setInterval(performAnalysis, 5000);
  };

  const stopAnalysis = () => {
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
      analysisInterval.current = null;
    }
  };

  const performAnalysis = async () => {
    // We are not passing real video data, this is a mock
    const result = await runPanicDetection('dummy-data-uri');
    setPanicInfo(result);
    if (result.panicDetected) {
      toast({
        title: `Panic Detected: ${result.alertLevel.toUpperCase()}`,
        description: `Actions taken: ${result.actionsTaken.join(', ')}`,
        variant: result.alertLevel === 'high' ? 'destructive' : 'default',
      });
    }
  };

  const startCall = async () => {
    setIsLoading(true);
    await getCameraPermission();
    
    setTimeout(() => {
      startLocationTracking();
      setIsCalling(true);
      setIsLoading(false);
      startAnalysis();
      toast({
        title: 'Guardian Alert Sent',
        description: `Notifying ${guardianCount} guardian${guardianCount !== 1 ? 's' : ''}.`,
      });
    }, 1500);
  };

  const endCall = () => {
    setIsCalling(false);
    stopAnalysis();
    stopLocationTracking();
    stopCamera();
    setPanicInfo(null);
    setLocation(null);
    setHasGpsPermission(undefined);
    toast({
      title: 'Call Ended',
    });
  };

  useEffect(() => {
    return () => {
      stopAnalysis();
      stopLocationTracking();
      stopCamera();
    };
  }, []);
  
  const LocationMap = () => (
    <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
      <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <h3 className="font-headline font-semibold">Live Location</h3>
        {hasGpsPermission === false && (
          <Alert variant="destructive" className="mt-2">
            <AlertTitle>GPS Access Denied</AlertTitle>
            <AlertDescription>
              Please enable location services to share your position.
            </AlertDescription>
          </Alert>
        )}
        {hasGpsPermission && location ? (
          <>
            <p className="text-sm text-muted-foreground font-mono">
              {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </p>
            <a
              href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
            >
              <Navigation size={12} />
              Open in Maps
            </a>
          </>
        ) : (
          hasGpsPermission !== false && <p className="text-sm text-muted-foreground">Tracking your position...</p>
        )}
      </div>
    </div>
  );

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
          <div className="flex flex-col items-center justify-center gap-6 p-8 min-h-[450px]">
            <div className="text-center">
              <h2 className="font-headline text-2xl font-bold text-foreground">In Case of Emergency</h2>
              <p className="text-muted-foreground">Press the button to alert your guardians</p>
            </div>
             {guardianCount === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Guardians Added</AlertTitle>
                <AlertDescription>
                  <Link href="/guardians" className="underline">Add guardians</Link> to be notified in an emergency.
                </AlertDescription>
              </Alert>
            )}
            <Button
              onClick={startCall}
              disabled={isLoading || guardianCount === 0}
              className="h-40 w-40 rounded-full bg-accent text-accent-foreground shadow-lg animate-pulse-strong flex flex-col gap-2 hover:bg-accent/90 disabled:animate-none"
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
            <Button variant="secondary" asChild>
                <Link href="/guardians" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Manage Guardians ({guardianCount})
                </Link>
            </Button>
          </div>
        ) : (
          <div className="min-h-[450px] flex flex-col">
            <div className="relative w-full aspect-[4/3] bg-gray-900">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                LIVE
              </div>
              {hasCameraPermission === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4">
                  <VideoOff className="h-10 w-10 mb-2" />
                  <h3 className="font-bold">Camera Not Available</h3>
                  <p className="text-center text-sm">Please grant camera permission in your browser settings.</p>
                </div>
              )}
            </div>
            <div className="flex-grow p-4 space-y-4">
              <LocationMap />
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
