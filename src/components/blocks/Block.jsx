import Carousel from './Carousel'
import Header from './Header'
import Hero from './Hero'
import TextBlock from './TextBlock'
import CTA from './CTA'
import CardGrid from './CardGrid'
import Gallery from './Gallery'
import Footer from './Footer'

// Renders a component section by its type (shared by the editor and public page).
const Block = ({ section, editable = false }) => {
  switch (section.component) {
    case 'header':
      return <Header props={section.props} editable={editable} />
    case 'hero':
      return <Hero props={section.props} editable={editable} />
    case 'text':
      return <TextBlock props={section.props} editable={editable} />
    case 'cta':
      return <CTA props={section.props} editable={editable} />
    case 'cardgrid':
      return <CardGrid props={section.props} editable={editable} />
    case 'gallery':
      return <Gallery props={section.props} editable={editable} />
    case 'carousel':
      return <Carousel props={section.props} editable={editable} />
    case 'footer':
      return <Footer props={section.props} editable={editable} />
    default:
      return null
  }
}

export default Block
