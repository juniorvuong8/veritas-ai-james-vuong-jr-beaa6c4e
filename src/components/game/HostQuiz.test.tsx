import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { validLesson } from '@/shared/test-fixtures'
import { HostQuiz } from './HostQuiz'

describe('HostQuiz', () => {
  it('rewards right answers and reports the result', async () => {
    const user = userEvent.setup()
    const onCorrect = vi.fn()
    const onFinish = vi.fn()
    render(<HostQuiz quiz={validLesson().quiz} hostAvatar="🧑‍🍳" onCorrect={onCorrect} onFinish={onFinish} />)

    await user.click(screen.getByRole('button', { name: 'menu' })) // right
    expect(onCorrect).toHaveBeenCalledTimes(1)
    expect(screen.getByText('+10 🪙')).toBeInTheDocument()
    expect(screen.getByText('Đúng rồi!')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Câu tiếp theo' }))

    await user.click(screen.getByRole('button', { name: 'menu' })) // wrong (to go)
    expect(onCorrect).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Chưa đúng.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Câu tiếp theo' }))

    await user.click(screen.getByRole('button', { name: 'receipt' })) // right
    expect(onCorrect).toHaveBeenCalledTimes(2)
    await user.click(screen.getByRole('button', { name: 'Xem kết quả' }))
    expect(onFinish).toHaveBeenCalledWith({ correct: 2, total: 3 })
  })
})
