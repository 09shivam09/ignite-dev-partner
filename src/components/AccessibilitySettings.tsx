import { useAccessibility } from "./AccessibilityProvider";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Switch } from "./ui/switch";
import { Settings } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const AccessibilitySettings = () => {
  const {
    reducedMotion,
    highContrast,
    fontSize,
    toggleReducedMotion,
    toggleHighContrast,
    setFontSize,
  } = useAccessibility();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="hover-lift">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Accessibility Settings</SheetTitle>
          <SheetDescription>
            Customize your experience for better accessibility
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Reduced Motion */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reduce Motion</CardTitle>
              <CardDescription>
                Minimize animations for a calmer experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="reduced-motion">Enable Reduced Motion</Label>
                <Switch
                  id="reduced-motion"
                  checked={reducedMotion}
                  onCheckedChange={toggleReducedMotion}
                />
              </div>
            </CardContent>
          </Card>

          {/* High Contrast */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">High Contrast</CardTitle>
              <CardDescription>
                Increase contrast for better visibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="high-contrast">Enable High Contrast</Label>
                <Switch
                  id="high-contrast"
                  checked={highContrast}
                  onCheckedChange={toggleHighContrast}
                />
              </div>
            </CardContent>
          </Card>

          {/* Font Size */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Font Size</CardTitle>
              <CardDescription>
                Adjust text size for comfortable reading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={fontSize} onValueChange={setFontSize}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal">Normal (100%)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="large" id="large" />
                  <Label htmlFor="large">Large (125%)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="xlarge" id="xlarge" />
                  <Label htmlFor="xlarge">Extra Large (150%)</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};
