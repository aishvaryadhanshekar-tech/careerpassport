import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { demoService } from './service';
import { STAGE_TYPE_META } from '../tripStages';
import './demo.css';
export function TripAssignmentExperience(){
  const {id,assignmentId}=useParams();
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [notice,setNotice]=useState('');
  const [done,setDone]=useState(false);
  const project=id?demoService().get(id):null;
  const assignment=project?.assignments[assignmentId||''];
  const trip=assignment?.tripSnapshot;
  return <div className="demo-application"><main>{!trip?<><h1>Invitation not found</h1><p>Open this invitation in the browser where the demo was created, or ask the hiring team for a new link.</p></>:<>
    <h1>{trip.title}</h1><p>{trip.spine}</p>
    {done||assignment?.status==='completed'?<h2>Response received</h2>:<form onSubmit={e=>{e.preventDefault();try{demoService().respondFullTrip(id!,assignmentId!,answers);setDone(true);}catch(error){setNotice(error instanceof Error?error.message:'Unable to submit.');}}}>
      {trip.stages.map(stage=><section key={stage.id}><h2>{STAGE_TYPE_META[stage.type]?.label??stage.type.replaceAll('_',' ')} · {stage.durationMinutes} min</h2><p>{stage.spokenInstructions}</p>{stage.items.map(q=><label key={q.id}>{q.prompt}{q.required==='mandatory'?' *':''}
        {['multiple_choice','dropdown'].includes(q.type)?<select required={q.required==='mandatory'} value={answers[q.id]||''} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))}><option value="">Choose an answer</option>{q.options.map((o,i)=><option key={i}>{o}</option>)}</select>:<textarea required={q.required==='mandatory'} value={answers[q.id]||''} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))}/>}
      </label>)}</section>)}
      {notice&&<p role="alert">{notice}</p>}<button type="submit">Submit response</button>
    </form>}
  </>}</main></div>;
}
