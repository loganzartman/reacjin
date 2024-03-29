import {Dialog as HeadlessDialog, Transition} from '@headlessui/react';
import React, {Fragment} from 'react';
import {MdOutlineClose} from 'react-icons/md';

import {Button} from '@/src/components/Button';

export function Dialog({
  isOpen,
  handleClose,
  children,
  title,
  showCloseButton,
}: {
  isOpen: boolean;
  handleClose: () => void;
  children: React.ReactNode;
  title: React.ReactNode;
  showCloseButton?: boolean;
}) {
  const closeButton = showCloseButton && (
    <Button icon={<MdOutlineClose />} onClick={handleClose} />
  );
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-10" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-background bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 -translate-y-2"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0 -translate-y-2"
            >
              <HeadlessDialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg ring-2 ring-brand-100/20 bg-background shadow-black shadow-lg p-4 pb-6 text-left align-middle transition-all">
                <HeadlessDialog.Title
                  as="div"
                  className="flex flex-row justify-between items-center text-xl font-semibold text-fg-300"
                >
                  <h3>{title}</h3>
                  <div>{closeButton}</div>
                </HeadlessDialog.Title>
                <div className="text-md font-medium text-fg-200 mt-6">
                  {children}
                </div>
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}
