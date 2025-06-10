"use client"
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel';
import { useConvexQuery } from '@/hooks/useConvexQuery';
import { AvatarFallback } from '@radix-ui/react-avatar';
import { Plus, User, Users } from 'lucide-react';
import Link from 'next/link';
import { groupCollapsed } from 'node:console';
import React, { useState } from 'react'
import { BarLoader } from 'react-spinners';
import CreateGroupModal from './_components/CreateGroupModal';
import { useRouter } from 'next/navigation';


type ContactUser = {
    _id: Id<"users">,
    name: string,
    email: string,
    imageUrl: string,
    type: "user"
  }

type Groups = {
    _id: Id<"groups">,
    name: string ,
    description: string ,
    memberCount: number ,
    type: "group",
  }

const ContactsPage = () => {
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const { data , isLoading} = useConvexQuery(api.contacts.getAllContacts);
  const router = useRouter();

  if(isLoading){
    <div className='container mx-auto py-12'>
      <BarLoader width={'100%'} color='#36d7b7'/>
    </div>
  }

  const {users, groups}:{users : ContactUser[] , groups : Groups[] } = data || {users:[] , groups:[]}

  return (
    <div className=' container py-6 mx-auto'>
      <div className=' flex items-center justify-between mb-6'>
        <h1 className=' text-5xl gradient-title'>Contacts</h1>
        <Button onClick={()=>setIsCreateGroupModalOpen(true)}>
          <Plus className=' w-4 h-4 mr-2'/>
          Create Group
        </Button>
      </div>

      <div className=' grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <h2 className=' text-xl font-semibold mb-4 flex items-center'>
            <User className=' mr-2 w-5 h-5'/>
            People
          </h2>

          {users.length === 0 ? 
            <Card>
              <CardContent className='py-6 text-center text-muted-foreground'>
                No contacts yet. Add an expense with someone to see then here.
              </CardContent>
            </Card>
          :
            <div className=' flex flex-col gap-4'>
              {users.map((user)=>(
                <Link key={user?._id} href={`/person/${user._id}`}>
                  <Card className=' hover:bg-muted/30 transition-colors cursor-pointer'>
                    <CardContent className='py-4'>
                      <div className=' flex items-center justify-between'>
                        <div className=' flex items-center gap-4'>
                          <div>
                            <Avatar className=' h-10 w-10'>
                              <AvatarImage src={user?.imageUrl} alt={user?.name}/>
                              <AvatarFallback>
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div>
                            <p className='font-medium'>{user.name}</p>
                            <p className='text-sm text-muted-foreground'>{user.email}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}

            </div>
          }

        </div>

        <div>
          <h2 className=' text-xl font-semibold mb-4 flex items-center'>
            <Users className=' mr-2 w-5 h-5'/>
            Groups
          </h2>

           {groups.length === 0 ? 
            <Card>
              <CardContent className='py-6 text-center text-muted-foreground'>
                No Groups yet. create a group to start tracking shared expenses.
              </CardContent>
            </Card>
          :
            <div className=' flex flex-col gap-4'>
              {groups.map((group)=>(
                <Link key={group?._id} href={`/person/${group._id}`}>
                  <Card className=' hover:bg-muted/30 transition-colors cursor-pointer'>
                    <CardContent className='py-4'>
                      <div className=' flex items-center justify-between'>
                        <div className=' flex items-center gap-4'>
                          <div className=' bg-primary/10 p-2 rounded-md'>
                           <Users className=' size-5 text-primary'/>
                          </div>
                          <div>
                            <p className='font-medium'>{group.name}</p>
                            <p className='text-sm text-muted-foreground'>{group.memberCount} members</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}

            </div>
          }
        </div>
      </div>

      {/* Create Group Modal  */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen} 
        onClose={()=>setIsCreateGroupModalOpen(false)} 
        onSuccess={(groupId)=>router.push(`/groups/${groupId}`)}
        />
    </div>
  )
}

export default ContactsPage