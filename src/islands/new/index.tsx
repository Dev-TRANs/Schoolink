import { createSignal, onMount } from "solid-js"
import { supabase } from "../../utils/supabase"
import { componentIsHTMLElement } from "astro/runtime/server/render/dom.js"

export default () => {
    const [title, setTitle] = createSignal('')
    const [description, setDescription] = createSignal('')

    const submit = async () => {
        if (title().length === 0) {
            return alert('タイトルを空にはできません')
        }
        if (description().length < 50) {
            return alert('内容は50文字以上でお願いします')
        }
        if (!confirm('内容を確定して送信しますか？')) {
            return
        }
        const result = await supabase.from('posts').insert([
            {
                title: title(),
                text: description()
            }
        ])
    }
    onMount(async () => {
        const session = await supabase.auth.getSession()
        if (!session.data.session) {
            location.href = '/login'
            return
        }

    })
    return <div>
        <div>投稿を作成する</div>
        <div>
            <div>
                <input placeholder="Title" onInput={e => setTitle(e.target.value)}/>
            </div>
            <div>
                <textarea onInput={e => setDescription(e.target.value)} placeholder="ここに内容を入力" />
            </div>
            <div>
                <button onClick={submit}>依頼を作成！</button>
            </div>
        </div>
    </div>
}