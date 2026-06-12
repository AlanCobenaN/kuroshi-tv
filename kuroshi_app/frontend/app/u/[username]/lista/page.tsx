import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ username: string }>
}

export default async function UserListaPage({ params }: Props) {
  const { username } = await params
  redirect(`/u/${username}?tab=lista`)
}
