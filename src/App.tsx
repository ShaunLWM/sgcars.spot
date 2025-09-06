import './App.css'
import { ImageGallery } from './components/image-gallery'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">   
        <main>
          <ImageGallery />
        </main>
      </div>
    </div>
  )
}

export default App
