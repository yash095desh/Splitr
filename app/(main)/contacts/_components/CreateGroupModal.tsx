"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { Doc } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useConvexMutation, useConvexQuery } from "@/hooks/useConvexQuery";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { UserPlus, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import Loader from "@/components/Loader";
import { toast } from "sonner";

type ModalParams = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (params: any) => void;
};

type SearchedUser = {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
};

const groupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
});

const CreateGroupModal: React.FC<ModalParams> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedMembers, setSelectedMembers] = useState<SearchedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);

  const createGroup = useConvexMutation(api.contacts.createGroup);
  const currentUser = useQuery(api.users.getCurrentUser);
  const {
    data: searchResults = [],
    isLoading: isSearching,
    error,
  } = useConvexQuery(api.users.searchUsers, { query: searchQuery });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: { name: string; description?: string }) => {
    try {
      const membersIds = selectedMembers.map((member) => member.id);

      const groupId = await createGroup.mutate({
        name: data.name,
        description: data.description,
        members: membersIds,
      });

      toast.success("Group Created successfully!");
      if (onSuccess) onSuccess(groupId);
      handleClose();
    } catch (error) {
      toast.error("Failed to create group: " + (error as Error).message);
    }
  };

  const handleClose = () => {
    //todo: reset form
    onClose();
  };

  const addMembers = (user: SearchedUser) => {
    if (!selectedMembers.some((m) => m.id === user.id)) {
      setSelectedMembers([...selectedMembers, user]);
    }
    setCommandOpen(false);
  };

  const removeMember = (user: SearchedUser) => {
    setSelectedMembers((prev) => [...prev.filter((u) => u.id !== user.id)]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <form className=" space-y-4 " onSubmit={handleSubmit(onSubmit)}>
          <div className=" space-y-2">
            <Label>Group Name</Label>
            <Input
              id="name"
              placeholder="Enter group name"
              {...register("name")}
            />
            {errors.name && (
              <p className=" text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className=" space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter group description"
              {...register("description")}
            />
            {errors.description && (
              <p className=" text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className=" space-y-2">
            <Label>Members</Label>
            <div className=" flex flex-wrap gap-2 mb-2">
              {/* current User badge  */}
              {currentUser && (
                <Badge variant={"secondary"} className=" px-3 py-1">
                  <Avatar>
                    <AvatarImage
                      src={currentUser?.imageUrl}
                      alt={currentUser?.name}
                    />
                    <AvatarFallback>
                      {currentUser?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{currentUser?.name} (You)</span>
                </Badge>
              )}

              {/* selected members  */}
              {selectedMembers.map((member) => (
                <Badge
                  variant={"secondary"}
                  className=" px-3 py-1"
                  key={member.id}
                >
                  <Avatar>
                    <AvatarImage src={member?.imageUrl} alt={member?.name} />
                    <AvatarFallback>
                      {member?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{member?.name}</span>
                  <button
                    onClick={() => removeMember(member)}
                    className=" text-muted-foreground hover:text-foreground ml-2"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}

              {/* add user to selected members  */}
              <Popover open={commandOpen} onOpenChange={setCommandOpen}>
                <PopoverTrigger asChild>
                  <Button
                    className=" h-8 gap-1 text-xs"
                    variant={"outline"}
                    size={"sm"}
                  >
                    <UserPlus className=" h-3.5 w-3.5 " />
                    Add member
                  </Button>
                </PopoverTrigger>
                <PopoverContent className=" p-0" align="start" side="bottom">
                  <Command className="rounded-lg border shadow-md md:min-w-[450px]">
                    <CommandInput
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {searchQuery.length < 2 ? (
                          <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                            Type atleast 2 characters to search
                          </p>
                        ) : isSearching ? (
                          <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                            Searching...
                          </p>
                        ) : (
                          <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                            No users found
                          </p>
                        )}
                      </CommandEmpty>
                      <CommandGroup heading="Users">
                        {searchResults.map((user: SearchedUser) => (
                          <CommandItem
                            key={user.id}
                            value={user.name + user.email}
                            onSelect={() => addMembers(user)}
                          >
                            <div className=" flex items-center gap-2">
                              <Avatar>
                                <AvatarImage
                                  src={user?.imageUrl}
                                  alt={user?.name}
                                />
                                <AvatarFallback>
                                  {user?.name?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className=" flex flex-col ">
                                <span className="text-sm">{user.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {selectedMembers.length === 0 && (
              <p className=" text-sm text-amber-600">
                Add at least one other person to the group
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant={"outline"} onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || selectedMembers.length === 0}
              className=" w-28"
            >
              {isSubmitting ? <Loader /> : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;
