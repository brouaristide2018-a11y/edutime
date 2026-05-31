import React from 'react';
import { useStore } from '../store';
import { startOfWeek, addDays, format, parseISO, isSameWeek } from 'date-fns';

interface ProfessorTimetableDocumentProps {
  professorId: string;
}

export function ProfessorTimetableDocument({ professorId }: ProfessorTimetableDocumentProps) {
  const { professors, courses, classes, subjects, timeSlots, settings } = useStore();
  
  const professor = professors.find(p => p.id === professorId);
  if (!professor) return null;

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const profCourses = courses.filter(c => 
    c.professorId === professorId && 
    isSameWeek(parseISO(c.date), weekStart, { weekStartsOn: 1 })
  );
  
  const weekDays = Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i));
  const dayNames = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];

  // Calculate summary data
  const summaryMap = new Map<string, { classInfo: any, subjectInfo: any, hours: number }>();
  
  profCourses.forEach(course => {
    const classInfo = classes.find(c => c.id === course.classId);
    const subjectInfo = subjects.find(s => s.id === course.subjectId);
    if (classInfo && subjectInfo && course.startTime && course.endTime) {
      const key = `${classInfo.id}-${subjectInfo.id}`;
      
      // Calculate duration as number of teaching periods (slots) covered
      const periodsCount = timeSlots.filter(slot => 
        slot.type !== 'Recréation' && slot.type !== 'Après-Midi' && 
        course.startTime < slot.endTime && course.endTime > slot.startTime
      ).length;

      const existing = summaryMap.get(key);
      if (existing) {
        existing.hours += periodsCount;
      } else {
        summaryMap.set(key, { classInfo, subjectInfo, hours: periodsCount });
      }
    }
  });

  // Sort summary data by class name for consistency
  const summaryData = Array.from(summaryMap.values()).sort((a, b) => 
    (a.classInfo?.name || "").localeCompare(b.classInfo?.name || "")
  );

  const totalTeachingHours = summaryData.reduce((sum, data) => sum + Math.max(0, data.hours), 0);

  // Determine number of columns (at least 6 as per request to keep layout stable)
  const dataColsCount = Math.max(6, summaryData.length);

  // Logic for augmentation: if any class has < 20 students, 1 hour augmentation is applied
  const hasSmallClass = summaryData.some(d => {
    const capacity = Number(d.classInfo?.capacity);
    return !isNaN(capacity) && capacity > 0 && capacity < 20;
  });
  
  const augmentationValue = hasSmallClass ? 1 : 0;
  const dechargeValue = 1; // CE decharge as seen in template
  const grandTotal = totalTeachingHours + augmentationValue;

  return (
    <div className="bg-white p-8 max-w-[210mm] mx-auto text-black text-[10px] font-sans" id="printable-timetable">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 text-center">
        <div className="w-1/3">
          <p className="font-bold uppercase leading-tight">MINISTERE DE L'EDUCATION NATIONALE, DE L'ALPHABETISATION ET DE L'ENSEIGNEMENT TECHNIQUE</p>
          <p className="my-1">-----------------</p>
          <p className="font-bold uppercase">DRENAET GAGNOA</p>
          <div className="my-2 h-12 w-12 mx-auto border border-gray-300 flex items-center justify-center rounded-full overflow-hidden">
            {settings?.logo ? (
              <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-[8px]">LOGO</span>
            )}
          </div>
          <p className="font-bold uppercase">{settings?.schoolName || "COLLEGE PRIVE ALBERT GOURI DE GAGNOA"}</p>
          <p>Tél : {settings?.phone || "07 48 71 78 75 / 07 08 85 20 47"}</p>
          <p>Email : {settings?.email || "collegeprivealbertgouri@gmail.com"}</p>
        </div>
        
        <div className="w-1/3 flex flex-col items-center">
          {/* Center could be empty or have something */}
        </div>

        <div className="w-1/3">
          <p className="font-bold uppercase">REPUBLIQUE DE COTE D'IVOIRE</p>
          <p className="italic text-[9px]">Union - Discipline - Travail</p>
          <div className="my-2 h-12 w-12 mx-auto border border-gray-300 flex items-center justify-center">
            <span className="text-[8px]">ARMOIRIES</span>
          </div>
          <p className="font-bold mt-4">Année Scolaire : {settings?.schoolYear || "2025-2026"}</p>
          <p className="font-bold mt-1">Code : 310682 Statut : Privé</p>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-4">
        <h1 className="inline-block border-2 border-black px-8 py-1 text-lg font-bold uppercase">
          EMPLOI DU TEMPS PROFESSEUR
        </h1>
      </div>

      {/* Professor Info */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h2 className="font-bold text-sm uppercase mb-2">
            M. {professor.lastName} {professor.firstName} ({professor.specialty})
          </h2>
          <div className="flex flex-wrap gap-2 mb-1">
            <div className="border border-black px-2 py-0.5"><span className="font-bold">Matricule :</span> E{professor.id.substring(0, 8).toUpperCase()}</div>
            <div className="border border-black px-2 py-0.5"><span className="font-bold">Sexe :</span> M</div>
            <div className="border border-black px-2 py-0.5"><span className="font-bold">Bivalent :</span> Non</div>
            <div className="border border-black px-2 py-0.5"><span className="font-bold">Contact :</span> {professor.phone || "0505712491"}</div>
          </div>
          <div className="flex flex-wrap gap-2 mb-1">
            <div className="border border-black px-2 py-0.5"><span className="font-bold">Statut :</span> professeur de collège</div>
            <div className="border border-black px-2 py-0.5 flex-1"><span className="font-bold">E-mail :</span> {professor.email}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="border border-black px-2 py-0.5 w-64"><span className="font-bold">Nombre d'Années d'enseignement :</span></div>
          </div>
        </div>
        <div className="w-24 h-32 border border-gray-300 ml-4 flex items-center justify-center bg-gray-50 overflow-hidden">
          {professor.photoUrl ? (
            <img src={professor.photoUrl} alt="Photo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="text-gray-400 text-xs">Photo</span>
          )}
        </div>
      </div>

      {/* Timetable Grid */}
      <table className="w-full border-collapse border border-black text-center mb-4">
        <thead>
          <tr>
            <th className="border border-black py-1 px-2 font-bold uppercase whitespace-nowrap w-auto">HORAIRES</th>
            {dayNames.map(day => (
              <th key={day} className="border border-black py-1 px-2 font-bold uppercase w-1/5">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(() => {
            const renderedCells = new Set<string>();
            
            return timeSlots.map((slot, slotIndex) => {
              if (slot.type === 'Recréation' || slot.type === 'Après-Midi') {
                return (
                  <tr key={slot.id} className="bg-gray-100">
                    <td className="border border-black py-1 px-2 font-bold whitespace-nowrap">
                      {slot.startTime} - {slot.endTime}
                    </td>
                    <td colSpan={5} className="border border-black py-1 px-2 font-bold uppercase tracking-widest">
                      {slot.name || slot.type}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={slot.id} className="h-12">
                  <td className="border border-black py-1 px-2 font-bold whitespace-nowrap">
                    {slot.startTime} - {slot.endTime}
                  </td>
                  {weekDays.map((date, dayIndex) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const cellKey = `${dateStr}-${slotIndex}`;
                    
                    if (renderedCells.has(cellKey)) {
                      return null; // Skip because it's covered by rowSpan
                    }

                    const dayCourses = profCourses.filter(c => 
                      c.date === dateStr && 
                      c.startTime < slot.endTime && 
                      c.endTime > slot.startTime
                    );

                    // If multiple courses somehow exist for the same slot, 
                    // we'll just take the first unique one to avoid duplicates shown in the screenshot
                    const firstCourse = dayCourses[0];

                    if (!firstCourse) {
                      return <td key={cellKey} className="border border-black p-1"></td>;
                    }

                    // Calculate span
                    let span = 0;
                    for (let i = slotIndex; i < timeSlots.length; i++) {
                      const nextSlot = timeSlots[i];
                      if (nextSlot.startTime < firstCourse.endTime && nextSlot.endTime > firstCourse.startTime) {
                        span++;
                        renderedCells.add(`${dateStr}-${i}`);
                      } else if (nextSlot.startTime >= firstCourse.endTime) {
                        break;
                      }
                    }

                    const classInfo = classes.find(cl => cl.id === firstCourse.classId);
                    const subjectInfo = subjects.find(s => s.id === firstCourse.subjectId);

                    return (
                      <td key={cellKey} rowSpan={span} className="border border-black p-1 text-[9px] bg-white">
                        <div className="flex flex-col items-center justify-center h-full min-h-[40px]">
                          <span className="font-bold">Classe ({classInfo?.name || '?'})</span>
                          <span className="uppercase text-blue-800 font-bold">Matière ({subjectInfo?.code || subjectInfo?.name || '?'})</span>
                          {firstCourse.schoolName && (
                            <span className="text-[8px] italic text-gray-700 mt-1 font-medium text-center">
                              {firstCourse.schoolName}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            });
          })()}
        </tbody>
      </table>

      {/* Summary Table */}
      <div className="text-center font-bold uppercase mb-1">TABLEAU RECAPITULATIF</div>
      <table className="w-full border-collapse border border-black text-center text-[9px]">
        <tbody>
          <tr>
            <td className="border border-black py-1 px-2 font-bold text-left w-48 uppercase">CLASSES</td>
            {summaryData.map((data, i) => (
              <td key={`class-${i}`} className="border border-black py-1 px-2">{data.classInfo?.name}</td>
            ))}
            {Array.from({ length: Math.max(0, dataColsCount - summaryData.length) }).map((_, i) => (
              <td key={`empty-class-${i}`} className="border border-black py-1 px-2"></td>
            ))}
            <td className="border border-black py-1 px-2 w-16" rowSpan={4}>
              <div className="font-bold text-lg">{totalTeachingHours}H</div>
            </td>
          </tr>
          <tr>
            <td className="border border-black py-1 px-2 font-bold text-left uppercase">EFFECTIFS</td>
            {summaryData.map((data, i) => (
              <td key={`eff-${i}`} className="border border-black py-1 px-2">{data.classInfo?.capacity}</td>
            ))}
            {Array.from({ length: Math.max(0, dataColsCount - summaryData.length) }).map((_, i) => (
              <td key={`empty-eff-${i}`} className="border border-black py-1 px-2"></td>
            ))}
          </tr>
          <tr>
            <td className="border border-black py-1 px-2 font-bold text-left uppercase">DISCIPLINES</td>
            {summaryData.map((data, i) => (
              <td key={`disc-${i}`} className="border border-black py-1 px-2 uppercase">{data.subjectInfo?.code || data.subjectInfo?.name}</td>
            ))}
            {Array.from({ length: Math.max(0, dataColsCount - summaryData.length) }).map((_, i) => (
              <td key={`empty-disc-${i}`} className="border border-black py-1 px-2"></td>
            ))}
          </tr>
          <tr>
            <td className="border border-black py-1 px-2 font-bold text-left uppercase">NOMBRE D'HEURES ENSEIGNEMENT</td>
            {summaryData.map((data, i) => (
              <td key={`hours-${i}`} className="border border-black py-1 px-2">{data.hours}</td>
            ))}
            {Array.from({ length: Math.max(0, dataColsCount - summaryData.length) }).map((_, i) => (
              <td key={`empty-hours-${i}`} className="border border-black py-1 px-2"></td>
            ))}
          </tr>
          <tr>
            <td className="border border-black py-1 px-2 font-bold text-left uppercase" colSpan={dataColsCount + 1}>COMPLÉMENT DE SERVICE</td>
            <td className="border border-black py-1 px-2"></td>
          </tr>
          <tr>
            <td className="border border-black py-1 px-2 font-bold text-left uppercase" rowSpan={2}>DECHARGES</td>
            <td className="border border-black py-1 px-2 font-bold">PP</td>
            <td className="border border-black py-1 px-2 font-bold">CE</td>
            <td className="border border-black py-1 px-2 font-bold">LABO</td>
            <td className="border border-black py-1 px-2 font-bold">BIB/CDI</td>
            <td className="border border-black py-1 px-2 font-bold">UP</td>
            <td className="border border-black py-1 px-2 w-16" rowSpan={2}>
              <div className="font-bold text-lg">{dechargeValue}H</div>
            </td>
          </tr>
          <tr>
            <td className="border border-black py-1 px-2"></td>
            <td className="border border-black py-1 px-2 font-bold">{dechargeValue}H</td>
            <td className="border border-black py-1 px-2"></td>
            <td className="border border-black py-1 px-2"></td>
            <td className="border border-black py-1 px-2"></td>
          </tr>
          <tr>
            <td className="border border-black py-1 px-2 font-bold text-left uppercase" colSpan={dataColsCount + 1}>
              AUGMENTATION DE SERVICE (CLASSE MOINS DE 20 ÉLÈVES)
            </td>
            <td className="border border-black py-1 px-2 font-bold">
              {augmentationValue > 0 ? `${augmentationValue}H` : ""}
            </td>
          </tr>
          <tr>
            <td className="border border-black py-1 px-2 font-bold text-left uppercase" colSpan={dataColsCount + 1}>TOTAL</td>
            <td className="border border-black py-1 px-2 font-bold text-lg">{grandTotal}H</td>
          </tr>
          <tr>
            <td className="border border-black py-1 px-2 font-bold text-left uppercase" colSpan={dataColsCount + 1}>MAXIMUM DE SERVICE</td>
            <td className="border border-black py-1 px-2 font-bold">25H</td>
          </tr>
          <tr>
            <td className="border border-black py-1 px-2 font-bold text-left uppercase" colSpan={dataColsCount + 1}>HEURES SUPPLÉMENTAIRES</td>
            <td className="border border-black py-1 px-2 font-bold">
              {grandTotal > 25 ? `${grandTotal - 25}H` : ""}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
