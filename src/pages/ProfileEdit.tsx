import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Camera, Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfileSuggestions } from "@/hooks/useProfileSuggestions";

const ProfileEdit = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { getSuggestions, loading: suggestionsLoading, suggestions } = useProfileSuggestions();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    bio: "",
    city: "",
    username: "",
    website_url: "",
    avatar_url: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setFormData({
            fullName: data.full_name || "",
            email: data.email || "",
            phone: data.phone || "",
            bio: data.bio || "",
            city: data.city || "",
            username: data.username || "",
            website_url: data.website_url || "",
            avatar_url: data.avatar_url || "",
          });
        }
      }
    } catch (error: any) {
      toast.error("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          bio: formData.bio,
          city: formData.city,
          username: formData.username,
          website_url: formData.website_url,
          avatar_url: formData.avatar_url,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      navigate("/profile");
    } catch (error: any) {
      toast.error(error.message || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleGetSuggestions = async () => {
    const result = await getSuggestions({
      full_name: formData.fullName,
      bio: formData.bio,
      phone: formData.phone,
      city: formData.city,
      avatar_url: formData.avatar_url,
      bio_tags: [],
    });
    if (result) {
      setShowSuggestions(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const initials = formData.fullName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Edit Profile</h1>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* AI Suggestions Card */}
        {suggestions && (
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Profile Completion</h3>
              </div>
              <span className="text-sm font-semibold">{suggestions.completionScore.toFixed(0)}%</span>
            </div>
            <Progress value={suggestions.completionScore} className="mb-4" />
            {showSuggestions && suggestions.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium mb-2">AI Suggestions:</p>
                {suggestions.suggestions.map((s, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Badge variant={s.priority === "high" ? "destructive" : s.priority === "medium" ? "default" : "secondary"} className="mt-0.5">
                      {s.priority}
                    </Badge>
                    <div>
                      <p className="text-sm font-semibold">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Profile Photo */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={formData.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Change profile photo</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={handleGetSuggestions} disabled={suggestionsLoading}>
            {suggestionsLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-2" />
                Get AI Suggestions
              </>
            )}
          </Button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
