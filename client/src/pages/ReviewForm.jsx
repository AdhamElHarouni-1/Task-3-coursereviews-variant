import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Edit mode: when there is an `id`, load the review and fill the form.
  useEffect(() => {
    if (!id) return
    let cancelled = false
    api
      .get(`/reviews/${id}`)
      .then(({ data }) => {
        if (cancelled) return
        const r = data.review ?? data
        setForm({
          courseCode: r.courseCode ?? '',
          rating: Number(r.rating),
          comment: r.comment ?? ''
        })
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load review')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  // One handler for all inputs; rating is stored as a number.
  function onChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: name === 'rating' ? Number(value) : value }))
  }

  // POST a new review, or PATCH the existing one when editing.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    // No reviewedBy: the server takes the reviewer from the token.
    const payload = {
      courseCode: form.courseCode.trim(),
      rating: form.rating,
      comment: form.comment
    }
    try {
      if (id) await api.patch(`/reviews/${id}`, payload)
      else await api.post('/reviews', payload)
      nav('/reviews')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium">Course code</span>
          <input
            name="courseCode"
            value={form.courseCode}
            onChange={onChange}
            placeholder="CS101"
            required
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Rating</span>
          <select
            name="rating"
            value={form.rating}
            onChange={onChange}
            className="mt-1 w-full border rounded px-3 py-2"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Comment (optional)</span>
          <textarea
            name="comment"
            value={form.comment}
            onChange={onChange}
            rows={4}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}