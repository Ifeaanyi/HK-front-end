import KingsCoachChat from '../components/KingsCoachChat';
import { useNavigate } from 'react-router-dom';

export default function CoachTest() {
  const navigate = useNavigate();
  return <KingsCoachChat onClose={() => navigate('/dashboard')} />;
}