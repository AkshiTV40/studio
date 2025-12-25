import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Logo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Guardian Keychain</CardTitle>
          <CardDescription className="text-muted-foreground pt-2">
            Your personal safety companion, always by your side.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            In an emergency, every second counts. Our app provides a direct link to your guardians, shares your live location, and uses AI to analyze your surroundings for potential threats.
          </p>
          <Link href="/keychain">
            <Button size="lg" className="w-full">
              Open Guardian Keychain
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
