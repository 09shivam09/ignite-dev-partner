import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  Camera,
  AlertCircle,
  MoveUp,
  MoveDown,
  Edit2
} from "lucide-react";

interface PortfolioItem {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  event_type: string | null;
}

interface VendorPortfolioManagerProps {
  vendorId: string;
}

/**
 * Vendor Portfolio Manager
 * Allows uploading, reordering, and managing portfolio images
 */
export const VendorPortfolioManager = ({ vendorId }: VendorPortfolioManagerProps) => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<PortfolioItem | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch portfolio items
  const { data: portfolioItems, isLoading, refetch } = useQuery({
    queryKey: ['vendor-portfolio', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_portfolio')
        .select('id, image_url, caption, display_order, event_type')
        .eq('vendor_id', vendorId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []) as PortfolioItem[];
    },
  });

  const handleAddImage = async () => {
    if (!imageUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter an image URL",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const maxOrder = portfolioItems?.length || 0;

      const { error } = await supabase
        .from('vendor_portfolio')
        .insert({
          vendor_id: vendorId,
          image_url: imageUrl.trim(),
          caption: caption.trim() || null,
          display_order: maxOrder,
        });

      if (error) throw error;

      toast({
        title: "Image Added",
        description: "Your portfolio image has been added successfully.",
      });

      setIsAddDialogOpen(false);
      setImageUrl("");
      setCaption("");
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add image",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCaption = async () => {
    if (!editingItem) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('vendor_portfolio')
        .update({ caption: caption.trim() || null })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast({
        title: "Caption Updated",
        description: "Your image caption has been saved.",
      });

      setEditingItem(null);
      setCaption("");
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update caption",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('vendor_portfolio')
        .delete()
        .eq('id', deleteItem.id);

      if (error) throw error;

      toast({
        title: "Image Deleted",
        description: "The image has been removed from your portfolio.",
      });

      setDeleteItem(null);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete image",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (itemId: string, direction: 'up' | 'down') => {
    if (!portfolioItems) return;

    const currentIndex = portfolioItems.findIndex(item => item.id === itemId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= portfolioItems.length) return;

    const currentItem = portfolioItems[currentIndex];
    const swapItem = portfolioItems[newIndex];

    try {
      // Swap display orders
      await supabase
        .from('vendor_portfolio')
        .update({ display_order: newIndex })
        .eq('id', currentItem.id);

      await supabase
        .from('vendor_portfolio')
        .update({ display_order: currentIndex })
        .eq('id', swapItem.id);

      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to reorder images",
        variant: "destructive",
      });
    }
  };

  const openEditCaption = (item: PortfolioItem) => {
    setEditingItem(item);
    setCaption(item.caption || "");
  };

  const itemCount = portfolioItems?.length || 0;
  const hasMinimumImages = itemCount >= 3;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Portfolio
              </CardTitle>
              <CardDescription>
                Showcase your best work to attract customers
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Guidance */}
          <div className={`p-3 rounded-lg mb-4 ${
            hasMinimumImages 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-amber-500/10 border border-amber-500/20'
          }`}>
            <div className="flex items-start gap-2">
              {hasMinimumImages ? (
                <Camera className="h-4 w-4 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              )}
              <div className="text-sm">
                <p className={hasMinimumImages ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}>
                  {hasMinimumImages 
                    ? `Great! You have ${itemCount} images in your portfolio.`
                    : `Add at least 3 photos for better visibility (${itemCount}/3)`
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Real wedding photos perform best. Show variety in your work.
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : itemCount === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                No portfolio images yet. Add your best work to attract clients.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Image
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {portfolioItems?.map((item, index) => (
                <div key={item.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={item.image_url}
                      alt={item.caption || "Portfolio image"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>

                  {/* Caption */}
                  {item.caption && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {item.caption}
                    </p>
                  )}

                  {/* Overlay controls */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                    {index > 0 && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => handleReorder(item.id, 'up')}
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                    )}
                    {index < itemCount - 1 && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => handleReorder(item.id, 'down')}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => openEditCaption(item)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => setDeleteItem(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Order badge */}
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 left-2 text-xs"
                  >
                    {index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Image Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Portfolio Image</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL *</Label>
              <Input
                id="image_url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/your-image.jpg"
              />
              <p className="text-xs text-muted-foreground">
                Enter a direct link to your image. Use high-quality wedding photos.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption">Caption (optional)</Label>
              <Input
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g., Wedding ceremony at Taj Palace"
              />
            </div>

            {imageUrl && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddImage} disabled={saving || !imageUrl.trim()}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add Image"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Caption Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Caption</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {editingItem && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-4">
                <img
                  src={editingItem.image_url}
                  alt="Portfolio image"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit_caption">Caption</Label>
              <Input
                id="edit_caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g., Wedding ceremony at Taj Palace"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCaption} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this image from your portfolio? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
