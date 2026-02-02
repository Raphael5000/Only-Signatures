// Client configuration with hardcoded credentials
// Add new clients here as needed

export const clients = [
  {
    id: 'moxii',
    name: 'Moxii Africa',
    username: 'moxii',
    password: 'moxii123',
    route: '/moxii-africa'
  },
  // Add more clients here:
  // {
  //   id: 'client-id',
  //   name: 'Client Name',
  //   username: 'username',
  //   password: 'password',
  //   route: '/client-route'
  // },
]

// Helper function to find a client by credentials
export function authenticateClient(username, password) {
  return clients.find(
    client => client.username === username && client.password === password
  )
}

// Helper function to get client by ID
export function getClientById(id) {
  return clients.find(client => client.id === id)
}
