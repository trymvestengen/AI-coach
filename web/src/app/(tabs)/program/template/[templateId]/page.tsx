import { redirect } from "next/navigation"

// Planning-skjermen er fjernet. Mal-lenker redirecter til program-lista.
// Bruker starter økt ved å trykke på malen i TrainingLibrary.
export default function TemplateDetailPage() {
  redirect("/program")
}
